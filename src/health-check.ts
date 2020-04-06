import fetch from 'node-fetch';
import * as core from '@actions/core';

import slackBot from './slackbot';

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

export default async (): Promise<void> => {
  const results = await Promise.all(endPoints.map(url => healthCheckSingleEndpoint(url, RETRIES)));
  const failedEndpoints = results.filter(([, result]) => !result).map(([url]) => url);
  if (failedEndpoints.length === 0) {
    return;
  }
  const message = `We failed to fetch ${failedEndpoints.join(', ')} with exit code 200.`;
  await slackBot(message);
  core.setFailed(message);
};
