const core = require('@actions/core');
const exec = require('@actions/exec');

/**
 * When the GitHub Actions job is done, logout of ECR Private/Public.
 */

const STATES = {
  registries: 'registries',
  containerCli: 'containerCli'
};

async function cleanup() {
  try {
    const registriesState = core.getState(STATES.registries);
    const containerCli = core.getState(STATES.containerCli) || 'docker';

    if (registriesState) {
      const registries = registriesState.split(',');
      const failedLogouts = [];

      // Logout of each registry
      for (const registry of registries) {
        core.info(`Logging out of registry ${registry}`);

        // Execute the container logout command
        let doLogoutStdout = '';
        let doLogoutStderr = '';
        const exitCode = await exec.exec(containerCli, ['logout', registry], {
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

module.exports = cleanup;

/* istanbul ignore next */
if (require.main === module) {
  cleanup();
}
