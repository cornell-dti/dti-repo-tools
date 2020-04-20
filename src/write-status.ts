import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import getPullRequest from './pull-request';

const getOctokit = (githubToken: string): Octokit =>
  new Octokit({
    auth: `token ${githubToken}`,
    userAgent: 'cornell-dti/write-status',
  });

export const writePendingOrCompletedStatus = async (
  githubToken: string,
  name: string,
  isPending: boolean
): Promise<void> => {
  const { owner, repo, commit } = getPullRequest();
  const octokit = getOctokit(githubToken);
  await octokit.repos.createStatus({
    owner,
    repo,
    context: name,
    sha: commit,
    state: isPending ? 'pending' : 'success',
  });
};

export default async (): Promise<void> => {
  const githubToken = process.env.BOT_TOKEN;
  if (githubToken == null) {
    core.setFailed('Bad token!');
    return;
  }
  const splitArguments = core.getInput('argument', { required: true }).trim().split(' ');
  const statusString = splitArguments[0];
  const isPending = statusString === 'pending';
  const name = splitArguments.slice(1).join(' ');
  await writePendingOrCompletedStatus(githubToken, name, isPending);
};
