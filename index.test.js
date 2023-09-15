const { run, replaceSpecialCharacters, configureProxy } = require('./index.js');
const core = require('@actions/core');
const exec = require('@actions/exec');
const { mockClient } = require('aws-sdk-client-mock');
const { ECRClient, GetAuthorizationTokenCommand } = require('@aws-sdk/client-ecr');
const { ECRPUBLICClient, GetAuthorizationTokenCommand: GetAuthorizationTokenCommandPublic } = require('@aws-sdk/client-ecr-public');

jest.mock('@actions/core');
jest.mock('@actions/exec');

function mockGetInput(requestResponse) {
  return function (name, options) { // eslint-disable-line no-unused-vars
    return requestResponse[name]
  }
}

const ECR_DEFAULT_INPUTS = {
  'http-proxy': '',
  'mask-password': '',
  'registries': '',
  'registry-type': '',
  'skip-logout': ''
};

const ECR_PUBLIC_DEFAULT_INPUTS = {
  'http-proxy': '',
  'mask-password': '',
  'registries': '',
  'registry-type': 'public',
  'skip-logout': ''
};

const defaultAuthToken = {
  authorizationData: {
    authorizationToken: Buffer.from('hello:world').toString('base64')
  }
};

const defaultOutputToken = {
  authorizationData: [
    {
      authorizationToken: Buffer.from('hello:world').toString('base64'),
      proxyEndpoint: 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'
    }
  ]
};

const ecrMock = mockClient(ECRClient);
const ecrPublicMock = mockClient(ECRPUBLICClient);

describe('Login to ECR', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    core.getInput = jest.fn().mockImplementation(mockGetInput(ECR_DEFAULT_INPUTS));

    ecrMock.reset();

    exec.exec.mockReturnValue(0);
  });

  test('gets auth token from ECR and logins the Docker client for the default registry', async () => {
    ecrMock.on(GetAuthorizationTokenCommand).resolves(defaultOutputToken);

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {});
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenNthCalledWith(1, 'registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledTimes(3);
    expect(core.saveState).toHaveBeenCalledTimes(1);
  });

  test('gets auth token from ECR and logins the Docker client for each provided registry', async () => {
    const mockInputs = {
      'mask-password': '',
      'registries': '123456789012,111111111111',
      'registry-type': '',
      'skip-logout': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [
        {
          authorizationToken: Buffer.from('hello:world').toString('base64'),
          proxyEndpoint: 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'
        },
        {
          authorizationToken: Buffer.from('foo:bar').toString('base64'),
          proxyEndpoint: 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'
        }
      ]
    });

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {
      registryIds: ['123456789012', '111111111111']
    });

    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(2,
      'docker',
      ['login', '-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenNthCalledWith(1, 'registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledTimes(4);
    expect(core.saveState).toHaveBeenCalledTimes(1);
  });

  test('outputs the registry ID if a single registry is provided in the input', async () => {
    const mockInputs = {
      'mask-password': '',
      'registries': '111111111111',
      'registry-type': '',
      'skip-logout': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [
        {
          authorizationToken: Buffer.from('foo:bar').toString('base64'),
          proxyEndpoint: 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'
        }
      ]
    });

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {
      registryIds: ['111111111111']
    });
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['login', '-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenCalledWith('registries', '111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledTimes(3);
    expect(core.saveState).toHaveBeenCalledTimes(1);
  });

  test('error is caught by core.setFailed for failed docker login', async () => {
    ecrMock.on(GetAuthorizationTokenCommand).resolves(defaultOutputToken);
    exec.exec.mockReturnValue(1);

    await run();

    expect(core.setFailed).toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith('registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(core.saveState).toHaveBeenCalledTimes(0);
  });

  test('logged-in registries are saved as state even if the action fails', async () => {
    const mockInputs = {
      'mask-password': '',
      'registries': '123456789012,111111111111',
      'registry-type': '',
      'skip-logout': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [
        {
          authorizationToken: Buffer.from('hello:world').toString('base64'),
          proxyEndpoint: 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'
        },
        {
          authorizationToken: Buffer.from('foo:bar').toString('base64'),
          proxyEndpoint: 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'
        }
      ]
    });
    exec.exec.mockImplementation((commandLine, args, options) => {
      options.listeners.stdout('Hello World ');
      options.listeners.stdout('on stdout\n');
      options.listeners.stderr('Some fancy error ');
      options.listeners.stderr('from docker login stderr');
      return (1);
    }).mockReturnValueOnce(0);

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {
      registryIds: ['123456789012', '111111111111']
    });
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(2,
      'docker',
      ['login', '-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenCalledWith('registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(core.setFailed).toHaveBeenCalledWith('Could not login to registry 111111111111.dkr.ecr.aws-region-1.amazonaws.com: Some fancy error from docker login stderr');
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.saveState).toHaveBeenCalledTimes(1);
  });

  test(`throws error when getAuthorizationToken does return an empty authorization data`, async () => {
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: []
    });

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {});
    expect(core.setFailed).toHaveBeenCalledWith('Amazon ECR authorization token does not contain any authorization data');
    expect(exec.exec).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(0);
    expect(core.saveState).toHaveBeenCalledTimes(0);
    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

  test(`throws error when getAuthorizationToken does not contain authorization data`, async () => {
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      foo: 'bar'
    });

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {});
    expect(core.setFailed).toHaveBeenCalledWith('Amazon ECR authorization token is invalid');
    expect(exec.exec).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(0);
    expect(core.saveState).toHaveBeenCalledTimes(0);
    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

  test(`throws error when getAuthorizationToken does not return data`, async () => {
    ecrMock.on(GetAuthorizationTokenCommand).resolves(null);

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {});
    expect(core.setFailed).toHaveBeenCalledWith('Amazon ECR authorization token returned no data');
    expect(exec.exec).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(0);
    expect(core.saveState).toHaveBeenCalledTimes(0);
    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

  test('error is caught by core.setFailed for ECR call', async () => {
    ecrMock.on(GetAuthorizationTokenCommand).rejects();

    await run();

    expect(core.setOutput).toHaveBeenCalledTimes(0);
    expect(core.saveState).toHaveBeenCalledTimes(0);
    expect(core.setFailed).toHaveBeenCalled();
  });

  test('skips logout when specified and logging into default registry', async () => {
    ecrMock.on(GetAuthorizationTokenCommand).resolves(defaultOutputToken);
    const mockInputs = {
      'mask-password': '',
      'registries': '',
      'registry-type': '',
      'skip-logout': 'true'
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {});
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenCalledTimes(0);
  });

  test('skips logout when specified and logging into multiple registries', async () => {
    const mockInputs = {
      'mask-password': '',
      'registries': '123456789012,111111111111',
      'registry-type': '',
      'skip-logout': 'true'
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [
        {
          authorizationToken: Buffer.from('hello:world').toString('base64'),
          proxyEndpoint: 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'
        },
        {
          authorizationToken: Buffer.from('foo:bar').toString('base64'),
          proxyEndpoint: 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'
        }
      ]
    });

    await run();

    ecrMock.commandCalls(GetAuthorizationTokenCommand, {
      registryIds: ['123456789012', '111111111111']
    });
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.saveState).toHaveBeenCalledTimes(0);
  });

  test('replaces special characters', () => {
    expect(replaceSpecialCharacters('111111111111.dkr.ecr.aws-region-1.amazonaws.com')).toBe('111111111111_dkr_ecr_aws_region_1_amazonaws_com')
    expect(replaceSpecialCharacters('229236603350.dkr.ecr.us-east-1.amazonaws.com')).toBe('229236603350_dkr_ecr_us_east_1_amazonaws_com')
  });

  test('sets the Actions outputs to the docker credentials', async () => {
    const mockInputs = {
      'mask-password': '',
      'registries': '123456789012,111111111111',
      'registry-type': '',
      'skip-logout': 'true'
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [
        {
          authorizationToken: Buffer.from('hello:world').toString('base64'),
          proxyEndpoint: 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'
        },
        {
          authorizationToken: Buffer.from('foo:bar').toString('base64'),
          proxyEndpoint: 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'
        }
      ]
    });

    await run();

    expect(core.setOutput).toHaveBeenCalledTimes(4);
    expect(core.setSecret).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'docker_username_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'hello');
    expect(core.setOutput).toHaveBeenNthCalledWith(2, 'docker_password_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'world');
    expect(core.setOutput).toHaveBeenNthCalledWith(3, 'docker_username_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'foo');
    expect(core.setOutput).toHaveBeenNthCalledWith(4, 'docker_password_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'bar');
  });

  test('sets the Actions outputs to the docker credentials with masked password', async () => {
    const mockInputs = {
      'mask-password': 'true',
      'registries': '123456789012,111111111111',
      'registry-type': '',
      'skip-logout': 'true'
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [
        {
          authorizationToken: Buffer.from('hello:world').toString('base64'),
          proxyEndpoint: 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'
        },
        {
          authorizationToken: Buffer.from('foo:bar').toString('base64'),
          proxyEndpoint: 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'
        }
      ]
    });

    await run();

    expect(core.setOutput).toHaveBeenCalledTimes(4);
    expect(core.setSecret).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'docker_username_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'hello');
    expect(core.setOutput).toHaveBeenNthCalledWith(2, 'docker_password_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'world');
    expect(core.setOutput).toHaveBeenNthCalledWith(3, 'docker_username_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'foo');
    expect(core.setOutput).toHaveBeenNthCalledWith(4, 'docker_password_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'bar');
  });

  describe('proxy settings', () => {
    afterEach(() => {
      process.env = {};
    });

    test('setting proxy with actions input', async () => {
      const EXPECTED_PROXY = 'http://test.me/';
      const httpsProxyAgent = configureProxy(EXPECTED_PROXY);
      expect(httpsProxyAgent).not.toBeNull();
      expect(httpsProxyAgent.defaultPort).toBe(80);
      expect(httpsProxyAgent.proxy.href).toBe(EXPECTED_PROXY);
    });
    test('setting proxy from environment vars', async () => {
      const EXPECTED_PROXY = 'http://test.me/'
      process.env.HTTP_PROXY = EXPECTED_PROXY;
      const httpsProxyAgent = configureProxy();
      expect(httpsProxyAgent).not.toBeNull();
      expect(httpsProxyAgent.defaultPort).toBe(80);
      expect(httpsProxyAgent.proxy.href).toBe(EXPECTED_PROXY);
    });

    test('setting proxy - prefer action input', async () => {
      const EXPECTED_PROXY = 'http://test.me/'
      const FALSE_PROXY = 'http://env.me/'
      process.env.HTTP_PROXY = FALSE_PROXY;
      const httpsProxyAgent = configureProxy(EXPECTED_PROXY);
      expect(httpsProxyAgent).not.toBeNull();
      expect(httpsProxyAgent.defaultPort).toBe(80);
      expect(httpsProxyAgent.proxy.href).toBe(EXPECTED_PROXY);
    });

    test('ignoring proxy - without anything set', async () => {
        const option = configureProxy();
        expect(option).toBeNull();
    });
  });
});

describe('Login to ECR Public', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ecrPublicMock.reset();

    core.getInput = jest.fn().mockImplementation(mockGetInput(ECR_PUBLIC_DEFAULT_INPUTS));

    exec.exec.mockReturnValue(0);
  });

  describe('inputs and outputs', () => {
    test('error is caught by core.setFailed for invalid registry-type input', async () => {
      const mockInputs = {
        'mask-password': '',
        'registries': '',
        'registry-type': 'invalid',
        'skip-logout': ''
      };
      core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).resolves(defaultAuthToken);

      await run();

      expect(core.setFailed).toHaveBeenCalledWith(`Invalid input for 'registry-type', possible options are [private, public]`);
      expect(core.saveState).toHaveBeenCalledTimes(0);
    });

    test('outputs the registry URI', async () => {
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).resolves(defaultAuthToken);
      await run();

      ecrPublicMock.commandCalls(GetAuthorizationTokenCommandPublic, {});
      expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', 'public.ecr.aws');
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(exec.exec).toHaveBeenNthCalledWith(1,
        'docker',
        ['login', '-u', 'hello', '-p', 'world', 'public.ecr.aws'],
        expect.anything());
      expect(core.saveState).toHaveBeenCalledWith('registries', 'public.ecr.aws');
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(core.setOutput).toHaveBeenCalledTimes(3);
      expect(core.saveState).toHaveBeenCalledTimes(1);
    });

    test('sets the Actions outputs to the docker credentials', async () => {
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).resolves(defaultAuthToken);
      await run();

      expect(core.setOutput).toHaveBeenCalledTimes(3);
      expect(core.setOutput).toHaveBeenNthCalledWith(2, 'docker_username_public_ecr_aws', 'hello');
      expect(core.setOutput).toHaveBeenNthCalledWith(3, 'docker_password_public_ecr_aws', 'world');
    });
  });

  describe('getAuthorizationToken', () => {
    test('gets auth token from ECR Public and logins the Docker client for the default registry', async () => {
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).resolves(defaultAuthToken);
      await run();

      ecrPublicMock.commandCalls(GetAuthorizationTokenCommandPublic, {});
      expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', 'public.ecr.aws');
      expect(exec.exec).toHaveBeenNthCalledWith(1,
        'docker',
        ['login', '-u', 'hello', '-p', 'world', 'public.ecr.aws'],
        expect.anything());
      expect(core.saveState).toHaveBeenNthCalledWith(1, 'registries', 'public.ecr.aws');
      expect(exec.exec).toHaveBeenCalledTimes(1);
      expect(core.setOutput).toHaveBeenCalledTimes(3);
      expect(core.saveState).toHaveBeenCalledTimes(1);
    });

    test(`throws error when getAuthorizationToken does return an empty authorization data`, async () => {
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).resolves({
        authorizationData: {}
      });

      await run();

      ecrPublicMock.commandCalls(GetAuthorizationTokenCommandPublic, {});
      expect(core.setFailed).toHaveBeenCalledWith('Amazon ECR Public authorization token does not contain any authorization data');
      expect(exec.exec).toHaveBeenCalledTimes(0);
      expect(core.setOutput).toHaveBeenCalledTimes(0);
      expect(core.saveState).toHaveBeenCalledTimes(0);
      expect(core.setFailed).toHaveBeenCalledTimes(1);
    });

    test(`throws error when getAuthorizationToken does not contain authorization data`, async () => {
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).resolves({
        hello: 'world'
      });

      await run();

      ecrPublicMock.commandCalls(GetAuthorizationTokenCommandPublic, {});
      expect(core.setFailed).toHaveBeenCalledWith('Amazon ECR Public authorization token is invalid');
      expect(exec.exec).toHaveBeenCalledTimes(0);
      expect(core.setOutput).toHaveBeenCalledTimes(0);
      expect(core.saveState).toHaveBeenCalledTimes(0);
      expect(core.setFailed).toHaveBeenCalledTimes(1);
    });

    test(`throws error when getAuthorizationToken does not return data`, async () => {
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).resolves(null);

      await run();

      ecrPublicMock.commandCalls(GetAuthorizationTokenCommandPublic, {});
      expect(core.setFailed).toHaveBeenCalledWith('Amazon ECR Public authorization token returned no data');
      expect(exec.exec).toHaveBeenCalledTimes(0);
      expect(core.setOutput).toHaveBeenCalledTimes(0);
      expect(core.saveState).toHaveBeenCalledTimes(0);
      expect(core.setFailed).toHaveBeenCalledTimes(1);
    });

    test('error is caught by core.setFailed for ECR call', async () => {
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).rejects();


      await run();

      expect(core.setOutput).toHaveBeenCalledTimes(0);
      expect(core.saveState).toHaveBeenCalledTimes(0);
      expect(core.setFailed).toHaveBeenCalled();
    });
  });
});
