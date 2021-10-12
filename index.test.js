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
    'registries': undefined,
    'skip-logout': undefined
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

        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(DEFAULT_INPUTS));

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
        expect(mockEcrGetAuthToken).toHaveBeenCalled();
        expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
        expect(exec.exec).toHaveBeenNthCalledWith(1,
            'docker login',
            ['-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(core.saveState).toHaveBeenCalledTimes(1);
        expect(core.saveState).toHaveBeenCalledWith('registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    });

    test('gets auth token from ECR and logins the Docker client for each provided registry', async () => {
        const mockInputs = {'registries' : '123456789012,111111111111'};
        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(mockInputs));
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
        expect(core.setOutput).toHaveBeenCalledTimes(4);
        expect(exec.exec).toHaveBeenCalledTimes(2);
        expect(exec.exec).toHaveBeenNthCalledWith(1,
            'docker login',
            ['-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(exec.exec).toHaveBeenNthCalledWith(2,
            'docker login',
            ['-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(core.saveState).toHaveBeenCalledTimes(1);
        expect(core.saveState).toHaveBeenCalledWith('registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    });

    test('outputs the registry ID if a single registry is provided in the input', async () => {
        const mockInputs = {'registries' : '111111111111'};
        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(mockInputs));
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

        expect(mockEcrGetAuthToken).toHaveBeenCalledWith({
            registryIds: ['111111111111']
        });
        expect(core.setOutput).toHaveBeenCalledTimes(3);
        expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '111111111111.dkr.ecr.aws-region-1.amazonaws.com');
        expect(exec.exec).toHaveBeenCalledTimes(1);
        expect(exec.exec).toHaveBeenNthCalledWith(1,
            'docker login',
            ['-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(core.saveState).toHaveBeenCalledTimes(1);
        expect(core.saveState).toHaveBeenCalledWith('registries', '111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    });

    test('error is caught by core.setFailed for failed docker login', async () => {
        exec.exec.mockReturnValue(1);

        await run();

        expect(core.setFailed).toBeCalled();
        expect(core.setOutput).toHaveBeenCalledWith('registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
        expect(core.saveState).toHaveBeenCalledTimes(0);
    });

    test('logged-in registries are saved as state even if the action fails', async () => {
        exec.exec.mockReturnValue(1).mockReturnValueOnce(0);

        const mockInputs = {'registries' : '123456789012,111111111111'};
        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(mockInputs));
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
        expect(core.setOutput).toHaveBeenCalledTimes(2);
        expect(exec.exec).toHaveBeenCalledTimes(2);
        expect(exec.exec).toHaveBeenNthCalledWith(1,
            'docker login',
            ['-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(exec.exec).toHaveBeenNthCalledWith(2,
            'docker login',
            ['-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());

        expect(core.setFailed).toBeCalled();
        expect(core.saveState).toHaveBeenCalledTimes(1);
        expect(core.saveState).toHaveBeenCalledWith('registries', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
    });

    test('error is caught by core.setFailed for ECR call', async () => {
        mockEcrGetAuthToken.mockImplementation(() => {
            throw new Error();
        });

        await run();

        expect(core.setFailed).toBeCalled();
        expect(core.setOutput).toHaveBeenCalledTimes(0);
        expect(core.saveState).toHaveBeenCalledTimes(0);
    });

    test('skips logout when specified and logging into default registry', async () => {
        const mockInputs = {'skip-logout' : true};
        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(mockInputs));

        await run();
        expect(mockEcrGetAuthToken).toHaveBeenCalled();
        expect(core.setOutput).toHaveBeenNthCalledWith(1, 'registry', '123456789012.dkr.ecr.aws-region-1.amazonaws.com');
        expect(exec.exec).toHaveBeenNthCalledWith(1,
            'docker login',
            ['-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(core.saveState).toHaveBeenCalledTimes(0);
    });

    test('skips logout when specified and logging into multiple registries', async () => {
        const mockInputs = {'registries' : '123456789012,111111111111', 'skip-logout' : true};
        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(mockInputs));
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
        expect(core.setOutput).toHaveBeenCalledTimes(4);
        expect(exec.exec).toHaveBeenCalledTimes(2);
        expect(core.saveState).toHaveBeenCalledTimes(0);
    });

    test('replaces special characters', () => {
        expect(replaceSpecialCharacters('111111111111.dkr.ecr.aws-region-1.amazonaws.com')).toBe('111111111111_dkr_ecr_aws_region_1_amazonaws_com')
        expect(replaceSpecialCharacters('229236603350.dkr.ecr.us-east-1.amazonaws.com')).toBe('229236603350_dkr_ecr_us_east_1_amazonaws_com')
    });

    test('sets the Actions outputs to the docker credentials', async () => {
        const mockInputs = {'registries' : '123456789012,111111111111', 'skip-logout' : true};
        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(mockInputs));
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
        expect(core.setOutput).toHaveBeenNthCalledWith(1, 'docker_username_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'hello');
        expect(core.setOutput).toHaveBeenNthCalledWith(2, 'docker_password_123456789012_dkr_ecr_aws_region_1_amazonaws_com', 'world');
        expect(core.setOutput).toHaveBeenNthCalledWith(3, 'docker_username_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'foo');
        expect(core.setOutput).toHaveBeenNthCalledWith(4, 'docker_password_111111111111_dkr_ecr_aws_region_1_amazonaws_com', 'bar');
    });
});
