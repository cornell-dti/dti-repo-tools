import * as core from '@actions/core';
import getPullRequest from './pull-request';
import { writeStatus } from './write-status';

const getMergeStatus = (): 'success' | 'pending' | 'failure' => {
  const { baseRef, headRef } = getPullRequest();
  core.info(`Trying to merge ${headRef} into ${baseRef}.`);
  switch (baseRef) {
    case 'release':
      core.setFailed(
        'Head ref must be master for release. Everything should go through staging first!'
      );
      return headRef === 'master' ? 'success' : 'failure';
    case 'master':
      return 'success';
    default:
      return 'pending';
  }
};

export default async (): Promise<void> => {
  const githubToken = process.env.BOT_TOKEN;
  if (githubToken == null) {
    core.setFailed('Bad token!');
    return;
  }
  const mergeStatus = getMergeStatus();
  await writeStatus(githubToken, 'Merge Policy', mergeStatus);
};
