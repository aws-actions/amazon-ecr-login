import { jest } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { ECRClient, GetAuthorizationTokenCommand } from '@aws-sdk/client-ecr';
import { ECRPUBLICClient, GetAuthorizationTokenCommand as GetAuthorizationTokenCommandPublic } from '@aws-sdk/client-ecr-public';
import { SigninClient, CreateBearerTokenCommand } from '@aws-sdk/client-signin';

jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  setSecret: jest.fn(),
  saveState: jest.fn(),
  getState: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
}));

jest.unstable_mockModule('@actions/exec', () => ({
  exec: jest.fn(),
}));

const core = await import('@actions/core');
const exec = await import('@actions/exec');
const { run, replaceSpecialCharacters, configureProxy } = await import('./index.js');

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
  'ecr-private-token-type': '',
  'skip-logout': ''
};

const ECR_PUBLIC_DEFAULT_INPUTS = {
  'http-proxy': '',
  'mask-password': '',
  'registries': '',
  'registry-type': 'public',
  'ecr-private-token-type': '',
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
const signinMock = mockClient(SigninClient);

// SDK settings that change endpoint resolution. The private registry tests control them
// and restore the caller's values afterwards, so they neither leak nor depend on the host.
const AWS_SDK_TEST_ENV_VARS = [
  'AWS_REGION',
  'AWS_CONFIG_FILE',
  'AWS_USE_DUALSTACK_ENDPOINT',
  'AWS_USE_FIPS_ENDPOINT',
  'AWS_ENDPOINT_URL',
  'AWS_ENDPOINT_URL_ECR',
  'AWS_IGNORE_CONFIGURED_ENDPOINT_URLS',
  'AWS_ENDPOINT_URL_SIGNIN',
  'AWS_EC2_METADATA_DISABLED'
];

function saveEnv(names) {
  return Object.fromEntries(names.map((name) => [name, process.env[name]]));
}

function restoreEnv(savedEnv) {
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

function makeBearerToken(claims) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `ASOA${encode({ typ: 'JWT', alg: 'ES256' })}.${encode(claims)}.signature`;
}

describe('Login to ECR', () => {
  let savedEnv;

  beforeEach(() => {
    jest.clearAllMocks();

    core.getInput.mockImplementation(mockGetInput(ECR_DEFAULT_INPUTS));

    ecrMock.reset();
    signinMock.reset();

    savedEnv = saveEnv(AWS_SDK_TEST_ENV_VARS);
    for (const name of AWS_SDK_TEST_ENV_VARS) {
      delete process.env[name];
    }
    process.env.AWS_REGION = 'us-west-2';
    process.env.AWS_CONFIG_FILE = '/nonexistent/amazon-ecr-login-test/config';

    exec.exec.mockReturnValue(0);
  });

  afterEach(() => {
    restoreEnv(savedEnv);
  });

  test('keeps the regional docker login options and masks after login', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'ecr-private-token-type': 'regional-token'
    }));
    ecrMock.on(GetAuthorizationTokenCommand).resolves(defaultOutputToken);

    await run();

    expect(exec.exec).toHaveBeenCalledTimes(1);
    const [command, args, options] = exec.exec.mock.calls[0];
    expect(command).toBe('docker');
    expect(args).toEqual(['login', '-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com']);
    expect(Object.keys(options).sort()).toEqual(['ignoreReturnCode', 'listeners', 'silent']);
    expect(options.silent).toBe(true);
    expect(options.ignoreReturnCode).toBe(true);
    expect(core.setSecret).toHaveBeenCalledTimes(1);
    expect(core.setSecret).toHaveBeenCalledWith('world');
    expect(core.setSecret.mock.invocationCallOrder[0])
      .toBeGreaterThan(exec.exec.mock.invocationCallOrder[0]);
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
    expect(signinMock.calls()).toHaveLength(0);
  });

  test('uses the regional token flow when regional-token is explicit', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'regional-token'
    }));
    ecrMock.on(GetAuthorizationTokenCommand).resolves(defaultOutputToken);

    await run();

    expect(ecrMock.commandCalls(GetAuthorizationTokenCommand, {
      registryIds: ['123456789012']
    })).toHaveLength(1);
    expect(core.debug).toHaveBeenCalledWith('Requesting auth token for 1 registries:');
    expect(signinMock.calls()).toHaveLength(0);
  });

  test('passes the raw global token to Docker and the credential output', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'mask-password': 'false',
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).callsFake(async (input, getClient) => {
      expect(await getClient().config.region()).toBe('us-west-2');
      return { accessToken: 'raw:global-token' };
    });

    await run();

    expect(ecrMock.calls()).toHaveLength(0);
    expect(signinMock.commandCalls(CreateBearerTokenCommand, {
      grantType: 'client_credentials',
      resource: 'ecr.amazonaws.com'
    })).toHaveLength(1);
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'raw:global-token', 'https://123456789012.dkr.ecr.us-west-2.amazonaws.com'],
      expect.anything());
    expect(core.setOutput).toHaveBeenCalledWith(
      'docker_username_123456789012_dkr_ecr_us_west_2_amazonaws_com',
      'AWS');
    expect(core.setOutput).toHaveBeenCalledWith(
      'docker_password_123456789012_dkr_ecr_us_west_2_amazonaws_com',
      'raw:global-token');
    expect(core.setOutput).toHaveBeenCalledWith(
      'registry',
      '123456789012.dkr.ecr.us-west-2.amazonaws.com');
    expect(core.saveState).toHaveBeenCalledWith(
      'registries',
      '123456789012.dkr.ecr.us-west-2.amazonaws.com');
    expect(core.debug).toHaveBeenCalledWith('Preparing login for 1 registries:');
    expect(core.setSecret).not.toHaveBeenCalled();
  });

  test('masks the global token after Docker login, like the regional token', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: 'global-token' });

    await run();

    expect(core.setSecret).toHaveBeenCalledTimes(1);
    expect(core.setSecret).toHaveBeenCalledWith('global-token');
    expect(exec.exec).toHaveBeenCalledTimes(1);
    const [command, args, options] = exec.exec.mock.calls[0];
    expect(command).toBe('docker');
    expect(args).toEqual(['login', '-u', 'AWS', '-p', 'global-token', 'https://123456789012.dkr.ecr.us-west-2.amazonaws.com']);
    expect(Object.keys(options).sort()).toEqual(['ignoreReturnCode', 'listeners', 'silent']);
    expect(options.silent).toBe(true);
    expect(options.ignoreReturnCode).toBe(true);
    expect(core.setSecret.mock.invocationCallOrder[0])
      .toBeGreaterThan(exec.exec.mock.invocationCallOrder[0]);
  });

  // The registry hostname GetAuthorizationToken returns for the same settings
  // (checked live for us-west-2 against the regional path).
  test.each([
    ['dual-stack', 'us-west-2', { AWS_USE_DUALSTACK_ENDPOINT: 'true' },
      'https://123456789012.dkr-ecr.us-west-2.on.aws'],
    ['FIPS', 'us-west-2', { AWS_USE_FIPS_ENDPOINT: 'true' },
      'https://123456789012.dkr.ecr-fips.us-west-2.amazonaws.com'],
    ['FIPS and dual-stack', 'us-west-2', { AWS_USE_FIPS_ENDPOINT: 'true', AWS_USE_DUALSTACK_ENDPOINT: 'true' },
      'https://123456789012.dkr-ecr-fips.us-west-2.on.aws'],
    ['dual-stack', 'cn-north-1', { AWS_USE_DUALSTACK_ENDPOINT: 'true' },
      'https://123456789012.dkr-ecr.cn-north-1.on.amazonwebservices.com.cn']
  ])('derives the %s registry hostname in %s', async (name, region, settings, proxyEndpoint) => {
    process.env.AWS_REGION = region;
    Object.assign(process.env, settings);
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: 'global-token' });

    await run();

    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'global-token', proxyEndpoint],
      expect.anything());
  });

  test.each([
    ['us-gov-west-1', 'https://123456789012.dkr.ecr.us-gov-west-1.amazonaws.com'],
    ['cn-north-1', 'https://123456789012.dkr.ecr.cn-north-1.amazonaws.com.cn']
  ])('derives the standard registry hostname in %s', async (region, proxyEndpoint) => {
    process.env.AWS_REGION = region;
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: 'global-token' });

    await run();

    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'global-token', proxyEndpoint],
      expect.anything());
  });

  test('uses one global token for every requested registry', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012,111111111111',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: 'global-token' });

    await run();

    expect(signinMock.commandCalls(CreateBearerTokenCommand)).toHaveLength(1);
    expect(exec.exec).toHaveBeenNthCalledWith(
      1,
      'docker',
      ['login', '-u', 'AWS', '-p', 'global-token', 'https://123456789012.dkr.ecr.us-west-2.amazonaws.com'],
      expect.anything());
    expect(exec.exec).toHaveBeenNthCalledWith(
      2,
      'docker',
      ['login', '-u', 'AWS', '-p', 'global-token', 'https://111111111111.dkr.ecr.us-west-2.amazonaws.com'],
      expect.anything());
  });

  test('rejects a whitespace account ID from stray commas for a global token', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012, ,',
      'ecr-private-token-type': 'global-token'
    }));
    await run();

    expect(core.setFailed).toHaveBeenCalledWith("Invalid ECR registry account ID: ' '");
    expect(signinMock.calls()).toHaveLength(0);
    expect(exec.exec).toHaveBeenCalledTimes(0);
  });

  test('rejects an empty account ID from a trailing comma for a global token', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012,',
      'ecr-private-token-type': 'global-token'
    }));
    await run();

    expect(core.setFailed).toHaveBeenCalledWith("Invalid ECR registry account ID: ''");
    expect(signinMock.calls()).toHaveLength(0);
    expect(exec.exec).toHaveBeenCalledTimes(0);
  });

  test('rejects a whitespace-only account ID for a global token', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': ' , ',
      'ecr-private-token-type': 'global-token'
    }));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith("Invalid ECR registry account ID: ' '");
    expect(signinMock.calls()).toHaveLength(0);
  });

  test('does not use a custom ECR API endpoint as the Docker registry hostname', async () => {
    process.env.AWS_ENDPOINT_URL_ECR = 'https://api.ecr.example.com';
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).callsFake(async (input, getClient) => {
      expect(getClient().config.ignoreConfiguredEndpointUrls).toBe(true);
      return { accessToken: 'global-token' };
    });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'global-token', 'https://123456789012.dkr.ecr.us-west-2.amazonaws.com'],
      expect.anything());
  });

  test('logs in to the caller registry when registries is not set for a global token', async () => {
    const token = makeBearerToken({ sub: 'arn:aws:sts::210987654321:assumed-role/Deploy/session' });
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: token });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(ecrMock.calls()).toHaveLength(0);
    expect(signinMock.commandCalls(CreateBearerTokenCommand)).toHaveLength(1);
    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', token, 'https://210987654321.dkr.ecr.us-west-2.amazonaws.com'],
      expect.anything());
    expect(core.setOutput).toHaveBeenCalledWith(
      'registry',
      '210987654321.dkr.ecr.us-west-2.amazonaws.com');
    expect(core.setOutput).toHaveBeenCalledWith(
      'docker_password_210987654321_dkr_ecr_us_west_2_amazonaws_com',
      token);
    expect(core.saveState).toHaveBeenCalledWith(
      'registries',
      '210987654321.dkr.ecr.us-west-2.amazonaws.com');
    expect(core.setSecret).toHaveBeenCalledWith(token);
    for (const log of [core.info, core.debug, core.warning]) {
      for (const args of log.mock.calls) {
        expect(String(args[0])).not.toContain(token);
      }
    }
  });

  test.each([
    ['an IAM user', 'arn:aws:iam::210987654321:user/deployer', 'us-west-2', {},
      'https://210987654321.dkr.ecr.us-west-2.amazonaws.com'],
    ['the root user', 'arn:aws:iam::210987654321:root', 'us-west-2', {},
      'https://210987654321.dkr.ecr.us-west-2.amazonaws.com'],
    ['a dual-stack role session', 'arn:aws:sts::210987654321:assumed-role/Deploy/session', 'us-west-2',
      { AWS_USE_DUALSTACK_ENDPOINT: 'true' }, 'https://210987654321.dkr-ecr.us-west-2.on.aws'],
    ['a federated user', 'arn:aws:sts::210987654321:federated-user/deployer', 'us-west-2', {},
      'https://210987654321.dkr.ecr.us-west-2.amazonaws.com'],
    ['an aws-cn role session', 'arn:aws-cn:sts::210987654321:assumed-role/Deploy/session', 'cn-north-1', {},
      'https://210987654321.dkr.ecr.cn-north-1.amazonaws.com.cn'],
    ['an aws-us-gov role session', 'arn:aws-us-gov:sts::210987654321:assumed-role/Deploy/session', 'us-gov-west-1', {},
      'https://210987654321.dkr.ecr.us-gov-west-1.amazonaws.com']
  ])('uses the account of %s as the default global-token registry', async (name, sub, region, settings, proxyEndpoint) => {
    process.env.AWS_REGION = region;
    Object.assign(process.env, settings);
    const token = makeBearerToken({ sub });
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: token });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', token, proxyEndpoint],
      expect.anything());
  });

  test.each([
    ['an opaque token', 'opaque-global-token'],
    ['a payload that is not JSON', 'ASOAaGVhZGVy.bm90LWpzb24.signature'],
    ['a null payload', `ASOAaGVhZGVy.${Buffer.from('null').toString('base64url')}.signature`],
    ['no subject', makeBearerToken({ iss: 'signin.amazonaws.com' })],
    ['a non-string subject', makeBearerToken({ sub: 210987654321 })],
    ['a subject that is not an ARN', makeBearerToken({ sub: 'AROAEXAMPLE:session' })],
    ['a subject without a 12-digit account', makeBearerToken({ sub: 'arn:aws:sts::2109876543:assumed-role/Deploy/s' })],
    ['a subject with a host in the account field', makeBearerToken({ sub: 'arn:aws:sts::attacker.example/x:role' })],
    ['a resource ARN subject', makeBearerToken({ sub: 'arn:aws:ecr:us-west-2:999999999999:repository/x' })],
    ['a subject that only looks like an ARN', makeBearerToken({ sub: 'foo:bar:baz::123456789012:x' })]
  ])('fails without logging in when the global token has %s and registries is not set', async (name, token) => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: token });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(
      "Could not read the caller account ID from the ECR global token; set 'registries'");
    expect(exec.exec).toHaveBeenCalledTimes(0);
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  test('does not read the global token when registries is set', async () => {
    const token = 'opaque-global-token';
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: token });

    await run();

    expect(exec.exec).toHaveBeenCalledTimes(1);
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', token, 'https://123456789012.dkr.ecr.us-west-2.amazonaws.com'],
      expect.anything());
  });

  test('reports SignIn errors for the default global-token registry', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).rejects(new Error('Access denied'));

    await run();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledWith(
      'Could not get an ECR global token for the default registry in region us-west-2: Access denied');
    expect(exec.exec).toHaveBeenCalledTimes(0);
  });

  test('rejects an account ID that could redirect the global token', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': 'attacker.example/path',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: 'global-token' });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(
      "Invalid ECR registry account ID: 'attacker.example/path'");
    expect(signinMock.calls()).toHaveLength(0);
    expect(exec.exec).toHaveBeenCalledTimes(0);
  });

  test('passes a FIPS pseudo-region through to SignIn in global-token mode', async () => {
    process.env.AWS_REGION = 'us-gov-west-1-fips';
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).callsFake(async (input, getClient) => {
      expect(await getClient().config.useFipsEndpoint()).toBe(true);
      expect(await getClient().config.region()).toBe('us-gov-west-1');
      return { accessToken: 'global-token' };
    });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(signinMock.commandCalls(CreateBearerTokenCommand)).toHaveLength(1);
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'global-token', 'https://123456789012.dkr.ecr-fips.us-gov-west-1.amazonaws.com'],
      expect.anything());
  });

  test('passes a FIPS setting through to SignIn in global-token mode', async () => {
    process.env.AWS_USE_FIPS_ENDPOINT = 'true';
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).callsFake(async (input, getClient) => {
      expect(await getClient().config.useFipsEndpoint()).toBe(true);
      return { accessToken: 'global-token' };
    });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(signinMock.commandCalls(CreateBearerTokenCommand)).toHaveLength(1);
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'global-token', 'https://123456789012.dkr.ecr-fips.us-west-2.amazonaws.com'],
      expect.anything());
  });

  test('reports SignIn errors in global-token mode', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).rejects(new Error('Access denied'));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(
      'Could not get an ECR global token for ' +
      '123456789012.dkr.ecr.us-west-2.amazonaws.com in region us-west-2: Access denied');
    expect(exec.exec).toHaveBeenCalledTimes(0);
  });

  test('wraps a SignIn error once with every registry and the region', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012,111111111111',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).rejects(
      new Error('FIPS endpoints are not supported for OAuth operations'));

    await run();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
    expect(core.setFailed).toHaveBeenCalledWith(
      'Could not get an ECR global token for ' +
      '123456789012.dkr.ecr.us-west-2.amazonaws.com, 111111111111.dkr.ecr.us-west-2.amazonaws.com ' +
      'in region us-west-2: FIPS endpoints are not supported for OAuth operations');
    expect(signinMock.commandCalls(CreateBearerTokenCommand)).toHaveLength(1);
    expect(exec.exec).toHaveBeenCalledTimes(0);
  });

  test('reports Docker login errors in global-token mode', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': '123456789012',
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: 'global-token' });
    exec.exec.mockImplementation(async (command, args, options) => {
      options.listeners.stderr(Buffer.from('login failed'));
      return 1;
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(
      'Could not login to registry 123456789012.dkr.ecr.us-west-2.amazonaws.com: login failed');
  });

  test.each(['Global-Token', 'GLOBAL-TOKEN'])(
    'accepts the ECR Private token type in any letter case: %s',
    async (tokenType) => {
      core.getInput.mockImplementation(mockGetInput({
        ...ECR_DEFAULT_INPUTS,
        'registries': '123456789012',
        'ecr-private-token-type': tokenType
      }));
      signinMock.on(CreateBearerTokenCommand).resolves({ accessToken: 'global-token' });

      await run();

      expect(core.setFailed).not.toHaveBeenCalled();
      expect(ecrMock.calls()).toHaveLength(0);
      expect(signinMock.commandCalls(CreateBearerTokenCommand)).toHaveLength(1);
    });

  test('accepts regional-token in any letter case', async () => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'ecr-private-token-type': 'Regional-Token'
    }));
    ecrMock.on(GetAuthorizationTokenCommand).resolves(defaultOutputToken);

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(ecrMock.commandCalls(GetAuthorizationTokenCommand)).toHaveLength(1);
    expect(signinMock.calls()).toHaveLength(0);
  });

  test.each(['automatic', 'global'])(
    'rejects unsupported ECR Private token type value %s',
    async (tokenType) => {
      core.getInput.mockImplementation(mockGetInput({
        ...ECR_DEFAULT_INPUTS,
        'ecr-private-token-type': tokenType
      }));

      await run();

      expect(core.setFailed).toHaveBeenCalledWith(
        "Invalid input for 'ecr-private-token-type', possible options are [regional-token, global-token]");
      expect(ecrMock.calls()).toHaveLength(0);
      expect(signinMock.calls()).toHaveLength(0);
    });

  test('does not infer global-token from an MRE registry hostname', async () => {
    const mreEndpoint = 'https://g-ABCDEFGHIJ.1234.ecr.global.on.aws';
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [{
        authorizationToken: Buffer.from('AWS:regional-token').toString('base64'),
        proxyEndpoint: mreEndpoint
      }]
    });

    await run();

    expect(signinMock.calls()).toHaveLength(0);
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'regional-token', mreEndpoint],
      expect.anything());
  });

  test.each([
    [null, '123456789012', 'Amazon SignIn bearer token returned no data'],
    [{}, '123456789012', 'Amazon SignIn bearer token is invalid'],
    [null, '', 'Amazon SignIn bearer token returned no data'],
    [{}, '', 'Amazon SignIn bearer token is invalid']
  ])('rejects an invalid SignIn response (%j, registries %j)', async (response, registries, error) => {
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'registries': registries,
      'ecr-private-token-type': 'global-token'
    }));
    signinMock.on(CreateBearerTokenCommand).resolves(response);

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(error);
    expect(exec.exec).toHaveBeenCalledTimes(0);
  });

  test('gets auth token from ECR and logins the Docker client for each provided registry', async () => {
    const mockInputs = {
      'mask-password': '',
      'registries': '123456789012,111111111111',
      'registry-type': '',
      'skip-logout': ''
    };
    core.getInput.mockImplementation(mockGetInput(mockInputs));
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
    expect(core.setSecret).toHaveBeenCalledTimes(2);
    expect(core.saveState).toHaveBeenCalledTimes(1);
  });

  test('outputs the registry ID if a single registry is provided in the input', async () => {
    const mockInputs = {
      'mask-password': '',
      'registries': '111111111111',
      'registry-type': '',
      'skip-logout': ''
    };
    core.getInput.mockImplementation(mockGetInput(mockInputs));
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
    core.getInput.mockImplementation(mockGetInput(mockInputs));
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
    core.getInput.mockImplementation(mockGetInput(mockInputs));

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
    core.getInput.mockImplementation(mockGetInput(mockInputs));
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
      'mask-password': 'false',
      'registries': '123456789012,111111111111',
      'registry-type': '',
      'skip-logout': 'true'
    };
    core.getInput.mockImplementation(mockGetInput(mockInputs));
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
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'docker_username_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'hello');
    expect(core.setOutput).toHaveBeenNthCalledWith(2, 'docker_password_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'world');
    expect(core.setOutput).toHaveBeenNthCalledWith(3, 'docker_username_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'foo');
    expect(core.setOutput).toHaveBeenNthCalledWith(4, 'docker_password_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'bar');
  });

  test('sets the Actions outputs to the docker credentials with masked password', async () => {
    const mockInputs = {
      'mask-password': '',
      'registries': '123456789012,111111111111',
      'registry-type': '',
      'skip-logout': 'true'
    };
    core.getInput.mockImplementation(mockGetInput(mockInputs));
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
    signinMock.reset();

    core.getInput.mockImplementation(mockGetInput(ECR_PUBLIC_DEFAULT_INPUTS));

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
      core.getInput.mockImplementation(mockGetInput(mockInputs));
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

    test('ignores ECR Private token type for ECR Public', async () => {
      core.getInput.mockImplementation(mockGetInput({
        ...ECR_PUBLIC_DEFAULT_INPUTS,
        'ecr-private-token-type': 'global-token'
      }));
      ecrPublicMock.on(GetAuthorizationTokenCommandPublic).resolves(defaultAuthToken);

      await run();

      expect(signinMock.calls()).toHaveLength(0);
      expect(ecrPublicMock.commandCalls(GetAuthorizationTokenCommandPublic, {})).toHaveLength(1);
      expect(exec.exec).toHaveBeenCalledWith(
        'docker',
        ['login', '-u', 'hello', '-p', 'world', 'public.ecr.aws'],
        expect.anything());
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

describe('Pod Identity Support', () => {
  const TEST_CONSTANTS = {
    POD_IDENTITY_URI: 'http://169.254.170.23/v2/credentials',
    REGISTRY_ID: '111111111111',
    REGISTRY_ENDPOINT: 'https://111111111111.dkr.ecr.region.amazonaws.com',
    DEFAULT_USERNAME: 'AWS',
    DEFAULT_PASSWORD: 'token'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {};
    ecrMock.reset();
    ecrPublicMock.reset();
    core.getInput.mockImplementation(mockGetInput({
      ...ECR_DEFAULT_INPUTS,
      'mask-password': 'true',
    }));
  });

  test('uses Pod Identity credentials when AWS_CONTAINER_CREDENTIALS_FULL_URI is set', async () => {
    process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI = TEST_CONSTANTS.POD_IDENTITY_URI;
    process.env.AWS_SDK_LOAD_CONFIG = '1';
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [{
        authorizationToken: Buffer.from('AWS:token').toString('base64'),
        proxyEndpoint: TEST_CONSTANTS.REGISTRY_ENDPOINT
      }]
    });

    await run();

    expect(process.env.AWS_SDK_LOAD_CONFIG).toBe('1');
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'token', TEST_CONSTANTS.REGISTRY_ENDPOINT],
      expect.anything()
    );
  });

  test('uses default credential chain when AWS_CONTAINER_CREDENTIALS_FULL_URI is not set', async () => {
    delete process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI;
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [{
        authorizationToken: Buffer.from('AWS:token').toString('base64'),
        proxyEndpoint: TEST_CONSTANTS.REGISTRY_ENDPOINT
      }]
    });

    await run();

    expect(process.env.AWS_SDK_LOAD_CONFIG).toBeUndefined();
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'token', TEST_CONSTANTS.REGISTRY_ENDPOINT],
      expect.anything()
    );
  });

  test('prefers IRSA over Pod Identity when both are configured', async () => {
    process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI = TEST_CONSTANTS.POD_IDENTITY_URI;
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE = '/var/run/secrets/token';
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [{
        authorizationToken: Buffer.from('AWS:token').toString('base64'),
        proxyEndpoint: TEST_CONSTANTS.REGISTRY_ENDPOINT
      }]
    });

    await run();

    expect(process.env.AWS_SDK_LOAD_CONFIG).toBeUndefined();
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'token', TEST_CONSTANTS.REGISTRY_ENDPOINT],
      expect.anything()
    );
  });

  test('handles both ECR Public and Private with Pod Identity', async () => {
    process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI = TEST_CONSTANTS.POD_IDENTITY_URI;
    process.env.AWS_SDK_LOAD_CONFIG = '1';
    const mockInputs = {
      'mask-password': 'true',
      'registries': TEST_CONSTANTS.REGISTRY_ID,
      'registry-type': 'private',
      'skip-logout': 'false'
    };
    core.getInput.mockImplementation(mockGetInput(mockInputs));

    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [{
        authorizationToken: Buffer.from('AWS:token').toString('base64'),
        proxyEndpoint: TEST_CONSTANTS.REGISTRY_ENDPOINT
      }]
    });

    await run();

    expect(process.env.AWS_SDK_LOAD_CONFIG).toBe('1');
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'token', TEST_CONSTANTS.REGISTRY_ENDPOINT],
      expect.anything()
    );
  });

  test('prefers explicit env var credentials over Pod Identity', async () => {
    process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI = TEST_CONSTANTS.POD_IDENTITY_URI;
    process.env.AWS_ACCESS_KEY_ID = 'mock-access-key-id';
    process.env.AWS_SECRET_ACCESS_KEY = 'mock-secret-access-key';
    process.env.AWS_SESSION_TOKEN = 'mock-session-token';
    ecrMock.on(GetAuthorizationTokenCommand).resolves({
      authorizationData: [{
        authorizationToken: Buffer.from('AWS:token').toString('base64'),
        proxyEndpoint: TEST_CONSTANTS.REGISTRY_ENDPOINT
      }]
    });

    await run();

    expect(process.env.AWS_SDK_LOAD_CONFIG).toBeUndefined();
    expect(exec.exec).toHaveBeenCalledWith(
      'docker',
      ['login', '-u', 'AWS', '-p', 'token', TEST_CONSTANTS.REGISTRY_ENDPOINT],
      expect.anything()
    );
  });

  test('handles error when Pod Identity credentials are invalid', async () => {
    process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI = TEST_CONSTANTS.POD_IDENTITY_URI;
    ecrMock.on(GetAuthorizationTokenCommand).rejects(new Error('Invalid credentials'));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith('Invalid credentials');
    expect(exec.exec).not.toHaveBeenCalled();
  });

  test('handles docker login failure in Pod Identity environment', async () => {
    process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI = TEST_CONSTANTS.POD_IDENTITY_URI;
    ecrMock.on(GetAuthorizationTokenCommand).resolves(defaultOutputToken);
    exec.exec.mockRejectedValue(new Error('Docker login failed'));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Docker login failed'));
    expect(exec.exec).toHaveBeenCalledTimes(1);
  });
});
