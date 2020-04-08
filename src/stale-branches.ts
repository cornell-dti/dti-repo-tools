import fetch from 'node-fetch';

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

const repositories = [
  'campus-density-android',
  'campus-density-backend',
  'campus-density-ios',
  'carriage-driver',
  'carriage-rider',
  'carriage-web',
  'course-plan',
  'course-reviews-react-2.0',
  'events-backend-2.0',
  'events-manager-android',
  'events-backend',
  'events-manager-ios',
  'flux-fitness',
  'flux-functions',
  'office-hours',
  'samwise',
];

const getAllStaleBranches = async (): Promise<StaleBranchInformation[]> => {
  const allStaleBranches = await Promise.all(
    repositories.map((repository) =>
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

const main = (): Promise<void> =>
  getAllStaleBranches().then((branches) =>
    branches.map(stringifyStaleBranchInformation).forEach((line) => console.log(line))
  );

export default main;