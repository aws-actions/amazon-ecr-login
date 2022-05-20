const cleanup = require('./cleanup.js');
const core = require('@actions/core');
const exec = require('@actions/exec');

jest.mock('@actions/core');
jest.mock('@actions/exec');

function mockGetState(requestResponse) {
  return function (name, options) { // eslint-disable-line no-unused-vars
    return requestResponse[name]
  }
}

const DEFAULT_STATES = {
  'registries': '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com',
  'client': 'docker'
};

describe('Logout from ECR', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    core.getState = jest.fn().mockImplementation(mockGetState(DEFAULT_STATES));
    exec.exec.mockReturnValue(0);
  });

  test('logs out docker client for registries in action state', async () => {
    await cleanup();

    expect(core.getState).toHaveBeenCalledWith('client');
    expect(core.getState).toHaveBeenCalledWith('registries');
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['logout', '123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(2,
      'docker',
      ['logout', '111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.setFailed).toHaveBeenCalledTimes(0);
  });

  test('logs out helm client for registries in action state', async () => {
    const mockStates = {
      'registries' : '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com',
      'client': 'helm'
    };
    core.getState = jest.fn().mockImplementation(mockGetState(mockStates));

    await cleanup();

    expect(core.getState).toHaveBeenCalledWith('client');
    expect(core.getState).toHaveBeenCalledWith('registries');
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'helm',
      ['registry', 'logout', '123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(2,
      'helm',
      ['registry', 'logout', '111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(core.setFailed).toHaveBeenCalledTimes(0);
  });

  test('handles zero registries', async () => {
    const mockStates = {
      'registries' : '',
      'client': 'docker'
    };
    core.getState = jest.fn().mockImplementation(mockGetState(mockStates));

    await cleanup();

    expect(core.getState).toHaveBeenCalledWith('client');
    expect(core.getState).toHaveBeenCalledWith('registries');
    expect(exec.exec).toHaveBeenCalledTimes(0);
    expect(core.setFailed).toHaveBeenCalledTimes(0);
  });

  test('error is caught by core.setFailed for failed docker logout', async () => {
    exec.exec.mockReturnValue(1);

    await cleanup();

    expect(core.setFailed).toHaveBeenCalled();
  });

  test('continues to attempt logouts after a failed logout', async () => {
    const mockStates = {
      'registries' : '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com,222222222222.dkr.ecr.aws-region-1.amazonaws.com',
      'client': 'docker'
    };
    core.getState = jest.fn().mockImplementation(mockGetState(mockStates));
    exec.exec.mockImplementationOnce((commandLine, args, options) => {
      options.listeners.stdout('stdout of ');
      options.listeners.stdout('registry 1');
      options.listeners.stderr('stderr of ');
      options.listeners.stderr('registry 1');
      return(1);
    }).mockImplementationOnce((commandLine, args, options) => {
      options.listeners.stdout('stdout of ');
      options.listeners.stdout('registry 2');
      options.listeners.stderr('stderr of ');
      options.listeners.stderr('registry 2');
      return(1);
    }).mockReturnValueOnce(0);

    await cleanup();

    expect(core.getState).toHaveBeenCalledWith('client');
    expect(core.getState).toHaveBeenCalledWith('registries');
    expect(exec.exec).toHaveBeenNthCalledWith(1,
      'docker',
      ['logout', '123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(2,
      'docker',
      ['logout', '111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(3,
      'docker',
      ['logout', '222222222222.dkr.ecr.aws-region-1.amazonaws.com'],
      expect.anything());
    expect(core.error).toHaveBeenNthCalledWith(1, 'Could not log out of registry 123456789012.dkr.ecr.aws-region-1.amazonaws.com: stderr of registry 1');
    expect(core.error).toHaveBeenNthCalledWith(2, 'Could not log out of registry 111111111111.dkr.ecr.aws-region-1.amazonaws.com: stderr of registry 2');
    expect(core.setFailed).toHaveBeenCalledWith('Failed to logout: 123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    expect(exec.exec).toHaveBeenCalledTimes(3);
    expect(core.error).toHaveBeenCalledTimes(2);
    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });
});
