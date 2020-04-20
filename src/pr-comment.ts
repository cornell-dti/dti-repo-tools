import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import getPullRequest from './pull-request';

const USER_LOGIN = 'dti-github-bot';

const getOctokit = (githubToken: string): Octokit =>
  new Octokit({
    auth: `token ${githubToken}`,
    userAgent: 'cornell-dti/big-diff-warning',
  });

const commentOnPullRequest = async (
  githubToken: string,
  prefix: string,
  comment: string
): Promise<void> => {
  const { owner, repo, number } = getPullRequest();
  const octokit = getOctokit(githubToken);
  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: number,
  });
  const existingComment = comments.find(
    (comment) => comment.user.login === USER_LOGIN && comment.body.startsWith(prefix)
  );
  const body = `${prefix} ${comment}`;
  if (existingComment == null) {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body,
    });
    return;
  }
  await octokit.issues.updateComment({
    owner,
    repo,
    comment_id: existingComment.id,
    body,
  });
};

export default async (): Promise<void> => {
  const githubToken = process.env.BOT_TOKEN;
  if (githubToken == null) {
    core.setFailed('Bad token!');
    return;
  }
  const splitArguments = core.getInput('argument', { required: true }).trim().split(' ');
  const prefix = splitArguments[0];
  const comment = splitArguments.slice(1).join(' ');
  await commentOnPullRequest(githubToken, prefix, comment);
};
