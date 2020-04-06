import * as core from '@actions/core';

import healthCheck from './health-check';
import prComment from './pr-comment';
import staleBranches from './stale-branches';

const actions: { readonly [command: string]: () => Promise<void> | undefined } = {
  'health-check': healthCheck,
  'pr-comment': prComment,
  'stale-branches': staleBranches,
};

(async () => {
  const command = core.getInput('command', { required: true }).trim();
  const action = actions[command];
  if (action == null) {
    core.setFailed(`Unsupported command: ${command}.`);
  }
  await action();
})();
