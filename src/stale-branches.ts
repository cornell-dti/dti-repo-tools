import fetch from 'node-fetch';
import slackbot from './slackbot';
import slackChannels from './data/slack-channels';
import {
  carriageRepositories,
  coursePlanRepositories,
  cuReviewsRepositories,
  eveRepositories,
  fluxRepositories,
  qmiRepositories,
  samwiseRepositories,
  allRepositories,
} from './data/project-repositories';

type GitHubBranchInformation = {
  readonly name: string;
  readonly commit: { readonly sha: string; readonly url: string };
  readonly protected: boolean;
};

type GitUserInformation = {
  readonly name: string;
  readonly email: string;
  readonly date: string;
};

type GitHubCommitInformation = {
  readonly commit: {
    readonly committer: GitUserInformation;
  };
};

type StaleBranchInformation = { readonly name: string; readonly lastUpdatedTime: Date };

const fetchJson = async (url: string): Promise<any> => {
  const response = await fetch(url, {
    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
  });
  return await response.json();
};

const getStaleBranches = async (repository: string): Promise<readonly StaleBranchInformation[]> => {
  const branchList: readonly GitHubBranchInformation[] = await fetchJson(
    `https://api.github.com/repos/cornell-dti/${repository}/branches`
  );
  const allBranchInformation = await Promise.all(
    branchList
      .filter((branch) => !branch.protected)
      .map(async (branch) => {
        const branchLastCommitInformation: GitHubCommitInformation = await fetchJson(
          branch.commit.url
        );
        const lastUpdatedTime = new Date(branchLastCommitInformation.commit.committer.date);
        return { name: branch.name, lastUpdatedTime };
      })
  );
  const aMonthAgo = new Date();
  aMonthAgo.setMonth(aMonthAgo.getMonth() - 1);
  return allBranchInformation.filter(({ lastUpdatedTime }) => lastUpdatedTime < aMonthAgo);
};

const getAllStaleBranches = async (): Promise<StaleBranchInformation[]> => {
  const allStaleBranches = await Promise.all(
    allRepositories.map((repository) =>
      getStaleBranches(repository).then((branches) =>
        branches.map(({ name, lastUpdatedTime }) => ({
          name: `${repository}/${name}`,
          lastUpdatedTime,
        }))
      )
    )
  );
  const flattenedStaleBranches: StaleBranchInformation[] = [];
  allStaleBranches.forEach((branches) => flattenedStaleBranches.push(...branches));
  flattenedStaleBranches.sort((branch1, branch2) => branch1.name.localeCompare(branch2.name));
  return flattenedStaleBranches;
};

const stringifyStaleBranchInformation = ({
  name,
  lastUpdatedTime,
}: StaleBranchInformation): string =>
  `Last updated time for ${name} is ${lastUpdatedTime.toLocaleDateString()} ${lastUpdatedTime.toLocaleTimeString()}`;

const shouldPostToProjectSlackChannels = (): boolean => {
  const now = new Date();
  // Only post at 5PM on Tuesday and Friday
  return (now.getUTCDay() === 2 || now.getUTCDay() === 5) && now.getUTCHours() === 21;
};

const postToSlack = async (
  branches: readonly StaleBranchInformation[],
  channel: keyof typeof slackChannels
): Promise<void> => {
  const allStaleBranchesString = branches.map(stringifyStaleBranchInformation).join('\n');
  const allStaleBranchesInformation = `*Stale Branches*\n${allStaleBranchesString}`;
  console.log(`Posting to ${channel}:\n${allStaleBranchesInformation}`);
  await slackbot(allStaleBranchesInformation, slackChannels[channel]);
};

const postToSubteamSlackChannel = async (
  branches: readonly StaleBranchInformation[],
  subteamRepositories: readonly string[],
  channel: keyof typeof slackChannels
): Promise<void> => {
  const filteredBranches = branches.filter(({ name }) =>
    subteamRepositories.some((repository) => name.includes(repository))
  );
  if (filteredBranches.length === 0) {
    return;
  }
  await postToSlack(filteredBranches, channel);
};

const main = async (): Promise<void> => {
  const branches = await getAllStaleBranches();
  if (!shouldPostToProjectSlackChannels()) {
    await Promise.all([
      postToSubteamSlackChannel(branches, carriageRepositories, 'carriage-dev'),
      postToSubteamSlackChannel(branches, coursePlanRepositories, 'cp-frontend'),
      postToSubteamSlackChannel(branches, cuReviewsRepositories, 'cu-reviews-devs'),
      postToSubteamSlackChannel(branches, eveRepositories, 'eve-dev'),
      postToSubteamSlackChannel(branches, fluxRepositories, 'flux-dev'),
      postToSubteamSlackChannel(branches, qmiRepositories, 'queue-me-in-dev'),
      postToSubteamSlackChannel(branches, samwiseRepositories, 'samwise-dev'),
    ]);
  } else {
    await postToSlack(branches, 'dev-slackbot');
  }
};

export default main;
