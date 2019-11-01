const run = require('.');
const core = require('@actions/core');
const exec = require('@actions/exec');

jest.mock('@actions/core');
jest.mock('@actions/exec');

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

        mockEcrGetAuthToken.mockImplementation((params) => {
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
    });

    test('gets auth token from ECR and logins the Docker client for each provided registry', async () => {
        core.getInput = jest.fn().mockReturnValueOnce('123456789012,111111111111');
        mockEcrGetAuthToken.mockImplementation((params) => {
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
        expect(core.setOutput).toHaveBeenCalledTimes(0);
        expect(exec.exec).toHaveBeenCalledTimes(2);
        expect(exec.exec).toHaveBeenNthCalledWith(1,
            'docker login',
            ['-u', 'hello', '-p', 'world', 'https://123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(exec.exec).toHaveBeenNthCalledWith(2,
            'docker login',
            ['-u', 'foo', '-p', 'bar', 'https://111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
    });

    test('error is caught by core.setFailed for failed docker login', async () => {
        exec.exec.mockReturnValue(1);

        await run();

        expect(core.setFailed).toBeCalled();
    });

    test('error is caught by core.setFailed for ECR call', async () => {
        mockEcrGetAuthToken.mockImplementation(() => {
            throw new Error();
        });

        await run();

        expect(core.setFailed).toBeCalled();
    });
});
