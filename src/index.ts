import * as core from '@actions/core';

import healthCheck from './health-check';
import memberWebsiteCheck from './member-website-check';
import mergePolicies from './merge-policies';
import prComment from './pr-comment';
import staleBranches from './stale-branches';
import writeStatus from './write-status';

const actions: { readonly [command: string]: () => Promise<void> | undefined } = {
  'health-check': healthCheck,
  'member-website-check': memberWebsiteCheck,
  'merge-policies': mergePolicies,
  'pr-comment': prComment,
  'stale-branches': staleBranches,
  'write-status': writeStatus,
};

(async () => {
  const command = core.getInput('command', { required: true }).trim();
  const action = actions[command];
  if (action == null) {
    core.setFailed(`Unsupported command: ${command}.`);
  }
  await action();
})();
