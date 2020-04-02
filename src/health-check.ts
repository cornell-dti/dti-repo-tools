import fetch from 'node-fetch';
import * as core from '@actions/core';

const healthCheckSingleEndpoint = (
  url: string,
  retriesLeft: number
): Promise<readonly [string, boolean]> =>
  fetch(url)
    .then(response => {
      const status = response.status;
      core.info(`Status of ${url} is ${status}.`);
      return [url, status === 200] as const;
    })
    .catch(error => {
      if (retriesLeft === 0) {
        core.error(`Failed to fetch ${url}.`);
        core.error(`Error: ${error}`);
        return [url, false] as const;
      }
      return healthCheckSingleEndpoint(url, retriesLeft - 1);
    });

const endPoints = [
  'https://courseplan.io/',
  'https://www.cureviews.org/',
  'https://queueme.in/',
  'https://www.research-connect.com/',
  'https://samwise.today/'
];

const RETRIES = 3;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

export default async (): Promise<void> => {
  const results = await Promise.all(endPoints.map(url => healthCheckSingleEndpoint(url, RETRIES)));
  const failedEndpoints = results.filter(([, result]) => !result).map(([url]) => url);
  if (failedEndpoints.length === 0) {
    return;
  }
  const message = `We failed to fetch ${failedEndpoints.join(', ')} with exit code 200.`;
  const slackbotSendResult = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL, text: message })
  });
  console.info(await slackbotSendResult.json());
  core.setFailed(message);
};
