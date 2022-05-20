const {run, replaceSpecialCharacters} = require('./index.js');
const core = require('@actions/core');
const exec = require('@actions/exec');

jest.mock('@actions/core');
jest.mock('@actions/exec');

function mockGetInput(requestResponse) {
  return function (name, options) { // eslint-disable-line no-unused-vars
    return requestResponse[name]
  }
}

const DEFAULT_INPUTS = {
  'registries': '',
  'skip-logout': '',
  'client': ''
};

const mockEcrGetAuthToken = jest.fn();
jest.mock('aws-sdk', () => {
  return {
    ECR: jest.fn(() => ({
      getAuthorizationToken: mockEcrGetAuthToken
    }))
  };
});

describe('Login to ECR', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    core.getInput = jest.fn().mockImplementation(mockGetInput(DEFAULT_INPUTS));

    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({
            authorizationData: [
              {
                authorizationToken: Buffer.from('hello:world').toString('base64'),
                proxyEndpoint: 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'
              }
            ]
          });
        }
      };
    });

    exec.exec.mockReturnValue(0);
  });

  test('gets auth token from ECR and logins the Docker client for the default registry', async () => {
    await run();

    expect(core.saveState).toHaveBeenNthCalledWith(1, 'client', 'docker');
    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({});
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenNthCalledWith(2, 'registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(core.setSecret).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledTimes(3);
    expect(core.saveState).toHaveBeenCalledTimes(2);
  });

  test('gets auth token from ECR and logins the Docker client for each provided registry', async () => {
    const mockInputs = {
      'registries' : '123456789012,111111111111',
      'skip-logout': '',
      'client': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({
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
        }
      };
    });

    await run();

    expect(core.saveState).toHaveBeenNthCalledWith(1, 'client', 'docker');
    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({
      registryIds: ['123456789012','111111111111']
    });
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(2,
      'docker',
      ['login', '-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenNthCalledWith(2, 'registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.setSecret).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledTimes(4);
    expect(core.saveState).toHaveBeenCalledTimes(2);
  });

  test('gets auth token from ECR and logins the Helm client for the default registry', async () => {
    const mockInputs = {
      'registries' : '',
      'skip-logout': '',
      'client': 'helm'
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));

    await run();

    expect(core.saveState).toHaveBeenNthCalledWith(1, 'client', 'helm');
    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({});
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'helm',
      ['registry', 'login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenNthCalledWith(2, 'registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(core.setSecret).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledTimes(3);
    expect(core.saveState).toHaveBeenCalledTimes(2);
  });

  test('gets auth token from ECR and logins the Helm client for each provided registry', async () => {
    const mockInputs = {
      'registries' : '123456789012,111111111111',
      'skip-logout': '',
      'client': 'helm'
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({
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
        }
      };
    });

    await run();

    expect(core.saveState).toHaveBeenNthCalledWith(1, 'client', 'helm');
    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({
      registryIds: ['123456789012','111111111111']
    });
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'helm',
      ['registry', 'login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(2,
      'helm',
      ['registry', 'login', '-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenNthCalledWith(2, 'registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.setSecret).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledTimes(4);
    expect(core.saveState).toHaveBeenCalledTimes(2);
  });

  test('error is caught by core.setFailed for invalid client input', async () => {
    const mockInputs = {
      'registries' : '',
      'skip-logout': '',
      'client': 'invalid'
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(`Invalid input for 'client', possible options are [docker, helm]`);
    expect(core.saveState).toHaveBeenCalledTimes(0);
  });

  test('outputs the registry ID if a single registry is provided in the input', async () => {
    const mockInputs = {
      'registries' : '111111111111',
      'skip-logout': '',
      'client': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({
            authorizationData: [
              {
                authorizationToken: Buffer.from('foo:bar').toString('base64'),
                proxyEndpoint: 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'
              }
            ]
          });
        }
      };
    });

    await run();

    expect(core.saveState).toHaveBeenNthCalledWith(1, 'client', 'docker');
    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({
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
    expect(core.setSecret).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledTimes(3);
    expect(core.saveState).toHaveBeenCalledTimes(2);
  });

  test('error is caught by core.setFailed for failed docker login', async () => {
    exec.exec.mockReturnValue(1);

    await run();

    expect(core.setFailed).toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith('registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(core.saveState).toHaveBeenCalledTimes(1);
  });

  test('logged-in registries are saved as state even if the action fails', async () => {
    const mockInputs = {
      'registries' : '123456789012,111111111111',
      'skip-logout': '',
      'client': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({
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
        }
      };
    });
    exec.exec.mockImplementation((commandLine, args, options) => {
      options.listeners.stdout('Hello World ');
      options.listeners.stdout('on stdout\n');
      options.listeners.stderr('Some fancy error ');
      options.listeners.stderr('from docker login stderr');
      return(1);
    }).mockReturnValueOnce(0);

    await run();

    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({
      registryIds: ['123456789012','111111111111']
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
    expect(core.setFailed).toHaveBeenCalledWith('Could not log into registry 111111111111.dkr.ecr.aws-region-1.amazonaws.com: Some fancy error from docker login stderr');
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.saveState).toHaveBeenCalledTimes(2);
  });

  test(`throws error when getAuthorizationToken does return an empty authorization data`, async () => {
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({authorizationData: []});
        }
      };
    });

    await run();

    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({});
    expect(core.setFailed).toHaveBeenCalledWith('Could not retrieve an authorization token from Amazon ECR');
    expect(exec.exec).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(0);
    expect(core.saveState).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

  test(`throws error when getAuthorizationToken does not contain authorization data`, async () => {
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({foo: 'bar'});
        }
      };
    });

    await run();

    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({});
    expect(core.setFailed).toHaveBeenCalledWith('Could not retrieve an authorization token from Amazon ECR');
    expect(exec.exec).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(0);
    expect(core.saveState).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

  test(`throws error when getAuthorizationToken does not return data`, async () => {
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECR.html#getAuthorizationToken-property
          // data (Object) — the de-serialized data returned from the request. Set to null if a request error occurs.
          return Promise.resolve(null);
        }
      };
    });

    await run();

    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({});
    expect(core.setFailed).toHaveBeenCalledWith('Could not retrieve an authorization token from Amazon ECR');
    expect(exec.exec).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(0);
    expect(core.saveState).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

  test('error is caught by core.setFailed for ECR call', async () => {
    mockEcrGetAuthToken.mockImplementation(() => {
      throw new Error();
    });

    await run();

    expect(core.setOutput).toHaveBeenCalledTimes(0);
    expect(core.saveState).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalled();
  });

  test('skips logout when specified and logging into default registry', async () => {
    const mockInputs = {
      'registries' : '',
      'skip-logout': 'true',
      'client': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));

    await run();

    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({});
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.saveState).toHaveBeenCalledTimes(1);
  });

  test('skips logout when specified and logging into multiple registries', async () => {
    const mockInputs = {
      'registries' : '123456789012,111111111111',
      'skip-logout': 'true',
      'client': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({
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
        }
      };
    });

    await run();

    expect(mockEcrGetAuthToken).toHaveBeenCalledWith({
      registryIds: ['123456789012','111111111111']
    });
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.saveState).toHaveBeenCalledTimes(1);
  });

  test('replaces special characters', () => {
    expect(replaceSpecialCharacters('111111111111.dkr.ecr.aws-region-1.amazonaws.com')).toBe('111111111111_dkr_ecr_aws_region_1_amazonaws_com')
    expect(replaceSpecialCharacters('229236603350.dkr.ecr.us-east-1.amazonaws.com')).toBe('229236603350_dkr_ecr_us_east_1_amazonaws_com')
  });

  test('sets the Actions outputs to the docker credentials', async () => {
    const mockInputs = {
      'registries' : '123456789012,111111111111',
      'skip-logout': 'true',
      'client': ''
    };
    core.getInput = jest.fn().mockImplementation(mockGetInput(mockInputs));
    mockEcrGetAuthToken.mockImplementation(() => {
      return {
        promise() {
          return Promise.resolve({
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
        }
      };
    });

    await run();

    expect(core.setSecret).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledTimes(4);
    expect(core.setSecret).toHaveBeenNthCalledWith(1, 'world');
    expect(core.setSecret).toHaveBeenNthCalledWith(2, 'bar');
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'docker_username_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'hello');
    expect(core.setOutput).toHaveBeenNthCalledWith(2, 'docker_password_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'world');
    expect(core.setOutput).toHaveBeenNthCalledWith(3, 'docker_username_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'foo');
    expect(core.setOutput).toHaveBeenNthCalledWith(4, 'docker_password_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'bar');
  });
});
