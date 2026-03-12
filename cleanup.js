import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { fileURLToPath } from 'node:url';

/**
 * When the GitHub Actions job is done, logout of ECR Private/Public.
 */

const STATES = {
  registries: 'registries'
};

async function cleanup() {
  try {
    const registriesState = core.getState(STATES.registries);

    if (registriesState) {
      const registries = registriesState.split(',');
      const failedLogouts = [];

      // Logout of each registry
      for (const registry of registries) {
        core.info(`Logging out of registry ${registry}`);

        // Execute the docker logout command
        let doLogoutStdout = '';
        let doLogoutStderr = '';
        const exitCode = await exec.exec('docker', ['logout', registry], {
          silent: true,
          ignoreReturnCode: true,
          listeners: {
            stdout: (data) => {
              doLogoutStdout += data.toString();
            },
            stderr: (data) => {
              doLogoutStderr += data.toString();
            }
          }
        });
        if (exitCode !== 0) {
          core.debug(doLogoutStdout);
          core.error(`Could not logout of registry ${registry}: ${doLogoutStderr}`);
          failedLogouts.push(registry);
        }
      }

      if (failedLogouts.length) {
        throw new Error(`Failed to logout: ${failedLogouts.join(',')}`);
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

export default cleanup;

/* istanbul ignore next */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanup();
}
