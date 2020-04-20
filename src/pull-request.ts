import * as github from '@actions/github';

export type PullRequest = {
  readonly title: string;
  readonly number: number;
  readonly owner: string;
  readonly repo: string;
  readonly commit: string;
  readonly baseRef: string;
  readonly headRef: string;
  readonly authorLogin: string;
};

const getPullRequest = (): PullRequest => {
  const pullRequest = github.context.payload.pull_request;
  if (pullRequest == null) {
    throw new Error('The action must be used in a PR context!');
  }
  return {
    title: pullRequest.title,
    number: pullRequest.number,
    owner: pullRequest.head.repo.owner.login,
    repo: pullRequest.head.repo.name,
    commit: pullRequest.head.sha,
    baseRef: pullRequest.base.ref,
    headRef: pullRequest.head.ref,
    authorLogin: pullRequest.user.login,
  };
};

export default getPullRequest;
