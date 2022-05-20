const core = require('@actions/core');
const exec = require('@actions/exec');

/**
 * When the GitHub Actions job is done, logout of ECR.
 */

async function cleanup() {
  try {
    const client = core.getState('client');
    const registriesState = core.getState('registries');

    if (registriesState) {
      const registries = registriesState.split(',');
      const failedLogouts = [];

      // Logout of each registry
      for (const registry of registries) {
        core.info(`Logging out of registry ${registry} with ${client}`);

        // Execute the docker/helm logout command
        const args = ['logout', registry];
        if (client === 'helm') {
          args.unshift('registry')
        }
        let doLogoutStdout = '';
        let doLogoutStderr = '';
        const exitCode = await exec.exec(client, args, {
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
          core.error(`Could not log out of registry ${registry}: ${doLogoutStderr}`);
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
