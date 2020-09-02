import fetch from 'node-fetch';
import * as core from '@actions/core';

import slackBot from './slackbot';
import slackChannels from './data/slack-channels';

export const healthCheckSingleEndpoint = (
  url: string,
  retriesLeft: number
): Promise<readonly [string, boolean, Error | undefined]> => {
  core.info(`Checking: ${url}`);
  return fetch(url, { timeout: 10000 })
    .then((response) => {
      const status = response.status;
      core.info(`Status of ${url} is ${status}.`);
      return [url, status === 200, undefined] as const;
    })
    .catch((error) => {
      if (retriesLeft === 0) {
        core.error(`Failed to fetch ${url}.`);
        core.error(`Error: ${error}`);
        return [url, false, error] as const;
      }
      return healthCheckSingleEndpoint(url, retriesLeft - 1);
    });
};

const endPoints = [
  'https://courseplan.io/',
  'https://www.cureviews.org/',
  'https://queueme.in/',
  'https://www.research-connect.com/',
  'https://samwise.today/',
];

const RETRIES = 3;

export default async (): Promise<void> => {
  const results = await Promise.all(
    endPoints.map((url) => healthCheckSingleEndpoint(url, RETRIES))
  );
  const failedEndpoints = results.filter(([, result]) => !result);
  if (failedEndpoints.length === 0) {
    return;
  }
  const message = failedEndpoints.map(([url, _, error]) => `We failed to fetch ${url} due to ${error}`).join("\n");
  await slackBot(message, slackChannels.alert);
  core.setFailed(message);
};
