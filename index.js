const core = require('@actions/core');
const exec = require('@actions/exec');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { NodeHttpHandler } = require('@aws-sdk/node-http-handler');
const { ECRClient, GetAuthorizationTokenCommand } = require("@aws-sdk/client-ecr");
const { ECRPUBLICClient, GetAuthorizationTokenCommand: GetAuthorizationTokenCommandPublic } = require("@aws-sdk/client-ecr-public");

const ECR_LOGIN_GITHUB_ACTION_USER_AGENT = 'amazon-ecr-login-for-github-actions';
const ECR_PUBLIC_REGISTRY_URI = 'public.ecr.aws';

const INPUTS = {
  httpProxy: 'http-proxy',
  maskPassword: 'mask-password',
  registries: 'registries',
  registryType: 'registry-type',
  skipLogout: 'skip-logout'
};

const OUTPUTS = {
  registry: 'registry',
  dockerUsername: 'docker_username',
  dockerPassword: 'docker_password'
};

const STATES = {
  registries: 'registries'
};

const REGISTRY_TYPES = {
  private: 'private',
  public: 'public'
};

function configureProxy(httpProxy) {
  const proxyFromEnv = process.env.HTTP_PROXY || process.env.http_proxy;

  if (httpProxy || proxyFromEnv) {
    let proxyToSet;

    if (httpProxy) {
      core.info(`Setting proxy from action input: ${httpProxy}`);
      proxyToSet = httpProxy;
    } else {
      core.info(`Setting proxy from environment: ${proxyFromEnv}`);
      proxyToSet = proxyFromEnv;
    }

    return new HttpsProxyAgent(proxyToSet);
  }
  return null;
}

async function getEcrAuthTokenWrapper(authTokenRequest, httpsProxyAgent) {
  const ecrClient = new ECRClient({
    customUserAgent: ECR_LOGIN_GITHUB_ACTION_USER_AGENT,
    requestHandler: new NodeHttpHandler({
      httpAgent: httpsProxyAgent,
      httpsAgent: httpsProxyAgent
    }),
  });
  const command = new GetAuthorizationTokenCommand(authTokenRequest);
  const authTokenResponse = await ecrClient.send(command);
  if (!authTokenResponse) {
    throw new Error('Amazon ECR authorization token returned no data');
  } else if (!authTokenResponse.authorizationData || !Array.isArray(authTokenResponse.authorizationData)) {
    throw new Error('Amazon ECR authorization token is invalid');
  } else if (!authTokenResponse.authorizationData.length) {
    throw new Error('Amazon ECR authorization token does not contain any authorization data');
  }

  return authTokenResponse;
}

async function getEcrPublicAuthTokenWrapper(authTokenRequest, httpsProxyAgent) {
  const ecrPublicClient = new ECRPUBLICClient({
    customUserAgent: ECR_LOGIN_GITHUB_ACTION_USER_AGENT,
    requestHandler: new NodeHttpHandler({
      httpAgent: httpsProxyAgent,
      httpsAgent: httpsProxyAgent
    }),
  });
  const command = new GetAuthorizationTokenCommandPublic(authTokenRequest);
  const authTokenResponse = await ecrPublicClient.send(command);
  if (!authTokenResponse) {
    throw new Error('Amazon ECR Public authorization token returned no data');
  } else if (!authTokenResponse.authorizationData) {
    throw new Error('Amazon ECR Public authorization token is invalid');
  } else if (Object.keys(authTokenResponse.authorizationData).length === 0) {
    throw new Error('Amazon ECR Public authorization token does not contain any authorization data');
  }

  return {
    authorizationData: [
      {
        authorizationToken: authTokenResponse.authorizationData.authorizationToken,
        proxyEndpoint: ECR_PUBLIC_REGISTRY_URI
      }
    ]
  };
}

function replaceSpecialCharacters(registryUri) {
  return registryUri.replace(/[^a-zA-Z0-9_]+/g, '_');
}

async function run() {
  // Get inputs
  const httpProxy = core.getInput(INPUTS.httpProxy, { required: false });
  const maskPassword = core.getInput(INPUTS.maskPassword, { required: false }).toLowerCase() === 'true';
  const registries = core.getInput(INPUTS.registries, { required: false });
  const registryType = core.getInput(INPUTS.registryType, { required: false }).toLowerCase() || REGISTRY_TYPES.private;
  const skipLogout = core.getInput(INPUTS.skipLogout, { required: false }).toLowerCase() === 'true';

  const registryUriState = [];

  try {
    if (registryType !== REGISTRY_TYPES.private && registryType !== REGISTRY_TYPES.public) {
      throw new Error(`Invalid input for '${INPUTS.registryType}', possible options are [${REGISTRY_TYPES.private}, ${REGISTRY_TYPES.public}]`);
    }

    // Notify customer if they don't have their password masked
    if (!maskPassword) {
      core.warning('Your docker password is not masked. See https://github.com/aws-actions/amazon-ecr-login#docker-credentials ' +
        'for more information. The default value of the \'mask-password\' input has changed from \'false\' to \'true\' in the v2 release. ' +
        'See https://github.com/aws-actions/amazon-ecr-login/issues/526 for more information.')
    }

    // Configures proxy
    const httpsProxyAgent = configureProxy(httpProxy);

    // Get the ECR/ECR Public authorization token(s)
    const authTokenRequest = {};
    if (registryType === REGISTRY_TYPES.private && registries) {
      const registryIds = registries.split(',');
      core.debug(`Requesting auth token for ${registryIds.length} registries:`);
      for (const id of registryIds) {
        core.debug(`  '${id}'`);
      }
      authTokenRequest.registryIds = registryIds;
    }
    const authTokenResponse = registryType === REGISTRY_TYPES.private ?
      await getEcrAuthTokenWrapper(authTokenRequest, httpsProxyAgent) :
      await getEcrPublicAuthTokenWrapper(authTokenRequest, httpsProxyAgent);

    // Login to each registry
    for (const authData of authTokenResponse.authorizationData) {
      const authToken = Buffer.from(authData.authorizationToken, 'base64').toString('utf-8');
      const creds = authToken.split(':', 2);
      const proxyEndpoint = authData.proxyEndpoint;
      const registryUri = proxyEndpoint.replace(/^https?:\/\//, '');

      core.info(`Logging into registry ${registryUri}`);

      // output the registry URI if this action is doing a single registry login
      if (authTokenResponse.authorizationData.length === 1) {
        core.setOutput(OUTPUTS.registry, registryUri);
      }

      // Execute the docker login command
      let doLoginStdout = '';
      let doLoginStderr = '';
      const exitCode = await exec.exec('docker', ['login', '-u', creds[0], '-p', creds[1], proxyEndpoint], {
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
        throw new Error(`Could not login to registry ${registryUri}: ${doLoginStderr}`);
      }

      // Output docker username and password
      const secretSuffix = replaceSpecialCharacters(registryUri);
      if (maskPassword) core.setSecret(creds[1]);
      core.setOutput(`${OUTPUTS.dockerUsername}_${secretSuffix}`, creds[0]);
      core.setOutput(`${OUTPUTS.dockerPassword}_${secretSuffix}`, creds[1]);

      registryUriState.push(registryUri);
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }

  // Pass the logged-in registry URIs to the post action for logout
  if (registryUriState.length) {
    if (!skipLogout) {
      core.saveState(STATES.registries, registryUriState.join());
    }
    core.debug(`'${INPUTS.skipLogout}' is ${skipLogout} for ${registryUriState.length} registries.`);
  }
}

module.exports = {
  configureProxy,
  run,
  replaceSpecialCharacters
};

/* istanbul ignore next */
if (require.main === module) {
  run();
}
