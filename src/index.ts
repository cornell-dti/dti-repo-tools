import * as core from '@actions/core';

import healthCheck from './health-check';

const actions: { readonly [command: string]: () => Promise<void> | undefined } = {
  'health-check': healthCheck
};

(async () => {
  const command = core.getInput('command', { required: true }).trim();
  const action = actions[command];
  if (action == null) {
    core.setFailed(`Unsupported command: ${command}.`);
  }
  await action();
})();
