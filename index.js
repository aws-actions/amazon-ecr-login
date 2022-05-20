const core = require('@actions/core');
const exec = require('@actions/exec');
const aws = require('aws-sdk');

function replaceSpecialCharacters(registryUri) {
  return registryUri.replace(/[^a-zA-Z0-9_]+/g, '_');
}

async function run() {
  // Get inputs
  const skipLogout = core.getInput('skip-logout', { required: false }).toLowerCase() === 'true';
  const registries = core.getInput('registries', { required: false });
  const client = core.getInput('client', { required: false }).toLowerCase() || 'docker';

  const registryUriState = [];

  try {
    if (client !== 'docker' && client !== 'helm') {
      throw new Error(`Invalid input for 'client', possible options are [docker, helm]`);
    }
    core.saveState('client', client);

    // Get the ECR authorization token(s)
    const ecr = new aws.ECR({
      customUserAgent: 'amazon-ecr-login-for-github-actions'
    });
    const authTokenRequest = {};
    if (registries) {
      const registryIds = registries.split(',');
      core.debug(`Requesting auth token for ${registryIds.length} registries:`);
      for (const id of registryIds) {
        core.debug(`  '${id}'`);
      }
      authTokenRequest.registryIds = registryIds;
    }
    const authTokenResponse = await ecr.getAuthorizationToken(authTokenRequest).promise();
    if (!authTokenResponse || !Array.isArray(authTokenResponse.authorizationData) || !authTokenResponse.authorizationData.length) {
      throw new Error('Could not retrieve an authorization token from Amazon ECR');
    }

    // Login to each registry
    for (const authData of authTokenResponse.authorizationData) {
      const authToken = Buffer.from(authData.authorizationToken, 'base64').toString('utf-8');
      const creds = authToken.split(':', 2);
      const proxyEndpoint = authData.proxyEndpoint;
      const registryUri = proxyEndpoint.replace(/^https?:\/\//,'');

      core.info(`Logging into registry ${registryUri} with ${client}`);

      // output the registry URI if this action is doing a single registry login
      if (authTokenResponse.authorizationData.length === 1) {
        core.setOutput('registry', registryUri);
      }

      // Execute the docker/helm login command
      const args = ['login', '-u', creds[0], '-p', creds[1], proxyEndpoint];
      if (client === 'helm') {
        args.unshift('registry')
      }
      let doLoginStdout = '';
      let doLoginStderr = '';
      const exitCode = await exec.exec(client, args, {
        silent: true,
        ignoreReturnCode: true,
        listeners: {
          stdout: (data) => {
            doLoginStdout += data.toString();
          },
          stderr: (data) => {
            doLoginStderr += data.toString();
          }
        }
      });
      if (exitCode !== 0) {
        core.debug(doLoginStdout);
        throw new Error(`Could not log into registry ${registryUri}: ${doLoginStderr}`);
      }

      // Output docker/helm username and password
      const secretSuffix = replaceSpecialCharacters(registryUri);
      core.setSecret(creds[1]);
      core.setOutput(`${client}_username_${secretSuffix}`, creds[0]);
      core.setOutput(`${client}_password_${secretSuffix}`, creds[1]);

      registryUriState.push(registryUri);
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }

  // Pass the logged-in registry URIs to the post action for logout
  if (registryUriState.length) {
    if (!skipLogout) {
      core.saveState('registries', registryUriState.join());
    }
    core.debug(`'skip-logout' is ${skipLogout} for ${registryUriState.length} registries.`);
  }
}

module.exports = {
  run,
  replaceSpecialCharacters
};

/* istanbul ignore next */
if (require.main === module) {
  run();
}
