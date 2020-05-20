import { readdirSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import * as core from '@actions/core';

import { healthCheckSingleEndpoint } from './health-check';
import slackBot from './slackbot';
import slackChannels from './data/slack-channels';

const MEMBER_JSON_PATH = 'website/packages/website/data/members';

type MemberWebsiteStatus = {
  readonly name: string;
  readonly website: string;
  readonly passedCheck: boolean;
};

type MemberWithWebsite = Omit<MemberWebsiteStatus, 'passedCheck'>;

export default async (): Promise<void> => {
  const jsonContents: readonly MemberWithWebsite[] = readdirSync(MEMBER_JSON_PATH)
    .filter((filename) => extname(filename) === '.json')
    .map((filename) => JSON.parse(readFileSync(join(MEMBER_JSON_PATH, filename)).toString()));

  const membersWithWebsite: readonly MemberWithWebsite[] = jsonContents
    .map(({ name, website }) => ({ name, website }))
    .filter(({ website }) => website != null && website.trim() !== '');

  core.info("Checking members' websites...");
  const statusList: readonly MemberWebsiteStatus[] = await Promise.all(
    membersWithWebsite.map(async ({ name, website }) =>
      healthCheckSingleEndpoint(website, 3).then(([, passedCheck]) => ({
        name,
        website,
        passedCheck,
      }))
    )
  );
  core.info("Checked all members' websites!");

  const errorMessage = statusList
    .filter(({ passedCheck }) => !passedCheck)
    .map(({ name, website }) => `${name}'s website (${website}) failed to load.`)
    .join('\n');
  if (errorMessage.length === 0) {
    core.info("Good. No members' websites are broken!");
    return;
  }
  core.error(errorMessage);
  await slackBot(errorMessage, slackChannels['dev-slackbot']);
};
