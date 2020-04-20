import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import getPullRequest from './pull-request';

const getOctokit = (githubToken: string): Octokit =>
  new Octokit({
    auth: `token ${githubToken}`,
    userAgent: 'cornell-dti/write-status',
  });

export const writeStatus = async (
  githubToken: string,
  name: string,
  state: 'pending' | 'success' | 'failure'
): Promise<void> => {
  const { owner, repo, commit } = getPullRequest();
  const octokit = getOctokit(githubToken);
  await octokit.repos.createStatus({
    owner,
    repo,
    context: name,
    sha: commit,
    state,
  });
};

export default async (): Promise<void> => {
  const githubToken = process.env.BOT_TOKEN;
  if (githubToken == null) {
    core.setFailed('Bad token!');
    return;
  }
  const splitArguments = core.getInput('argument', { required: true }).trim().split(' ');
  const status = splitArguments[0];
  if (status !== 'pending' && status !== 'success' && status !== 'failure') {
    core.setFailed(`Unsupported status: ${status}`);
    return;
  }
  const name = splitArguments.slice(1).join(' ');
  await writeStatus(githubToken, name, status);
};
