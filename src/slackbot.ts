import fetch from 'node-fetch';
import * as core from '@actions/core';

export default async (message: string, channel: string): Promise<void> => {
  const slackbotSendResult = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({ channel, text: message }),
  });
  core.info(`Sent data: ${JSON.stringify(await slackbotSendResult.json())}`);
};
