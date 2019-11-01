const core = require('@actions/core');
const exec = require('@actions/exec');
const aws = require('aws-sdk');

async function run() {
  try {
    const registries = core.getInput('registries', { required: false });

    // Get the ECR authorization token
    const ecr = new aws.ECR();
    const authTokenRequest = {};
    if (registries) {
      authTokenRequest.registryIds = registries.split(',')
    }
    const authTokenResponse = await ecr.getAuthorizationToken(authTokenRequest).promise();
    if (!Array.isArray(authTokenResponse.authorizationData) || !authTokenResponse.authorizationData.length) {
      throw new Error('Could not retrieve an authorization token from Amazon ECR');
    }

    for (const authData of authTokenResponse.authorizationData) {
      const authToken = Buffer.from(authData.authorizationToken, 'base64').toString('utf-8');
      const creds = authToken.split(':', 2);
      const proxyEndpoint = authData.proxyEndpoint;

      if (!registries) {
        // output the default registry if none were provided
        const registryId = proxyEndpoint.replace(/^https?:\/\//,'');
        core.setOutput('registry', registryId);
      }

      // Execute the docker login command
      let doLoginStdout = '';
      let doLoginStderr = '';
      const exitCode = await exec.exec('docker login', ['-u', creds[0], '-p', creds[1], proxyEndpoint], {
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

      if (exitCode != 0) {
        core.debug(doLoginStdout);
        throw new Error('Could not login: ' + doLoginStderr);
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
    run();
}
