const core = require('@actions/core');
const exec = require('@actions/exec');

/**
 * When the GitHub Actions job is done, remove saved ECR credentials from the
 * local Docker engine in the job's environment.
 */

async function cleanup() {
 try {
    const registriesState = core.getState('registries');
    if (registriesState) {
      const registries = registriesState.split(',');
      const failedLogouts = [];

      for (const registry of registries) {
        core.debug(`Logging out registry ${registry}`);

        // Execute the docker logout command
        let doLogoutStdout = '';
        let doLogoutStderr = '';
        const exitCode = await exec.exec('docker', ["logout", registry], {
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

        if (exitCode != 0) {
          core.debug(doLogoutStdout);
          core.error(`Could not logout registry ${registry}: ${doLogoutStderr}`);
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
