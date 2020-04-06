import fetch from 'node-fetch';

type GitHubBranchInformation = {
  readonly name: string;
  readonly commit: { readonly sha: string; readonly url: string };
  readonly protected: boolean;
};

type GitHubCommitInformation = {
  readonly commit: {
    readonly committer: {
      readonly name: string;
      readonly email: string;
      readonly date: string;
    };
  };
};

type StaleBranchInformation = { readonly name: string; readonly lastUpdatedTime: Date };

const getStaleBranches = async (repository: string): Promise<readonly StaleBranchInformation[]> => {
  const branchList: readonly GitHubBranchInformation[] = await (
    await fetch(`https://api.github.com/repos/cornell-dti/${repository}/branches`)
  ).json();
  const allBranchInformation = await Promise.all(
    branchList
      .filter((branch) => !branch.protected)
      .map(async (branch) => {
        const branchLastCommitInformation: GitHubCommitInformation = await (
          await fetch(branch.commit.url)
        ).json();
        const lastUpdatedTime = new Date(branchLastCommitInformation.commit.committer.date);
        return { name: branch.name, lastUpdatedTime };
      })
  );
  const aMonthAgo = new Date();
  aMonthAgo.setMonth(aMonthAgo.getMonth() - 1);
  return allBranchInformation.filter(({ lastUpdatedTime }) => lastUpdatedTime < aMonthAgo);
};

const repositories = ['office-hours'];

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
  return flattenedStaleBranches;
};

export default (): Promise<void> =>
  getAllStaleBranches().then((branches) => branches.forEach((branch) => console.log(branch)));
