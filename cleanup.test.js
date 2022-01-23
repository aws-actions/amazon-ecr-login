const cleanup = require('./cleanup.js');
const core = require('@actions/core');
const exec = require('@actions/exec');

jest.mock('@actions/core');
jest.mock('@actions/exec');

describe('Logout from ECR', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        core.getState.mockReturnValue(
            '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com');
        exec.exec.mockReturnValue(0);
    });

    test('logs out docker client for registries in action state', async () => {
        await cleanup();

        expect(core.getState).toHaveBeenCalledWith('registries');

        expect(exec.exec).toHaveBeenCalledTimes(2);
        expect(exec.exec).toHaveBeenNthCalledWith(1,
            'docker',
            ['logout', '123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(exec.exec).toHaveBeenNthCalledWith(2,
            'docker',
            ['logout', '111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());

        expect(core.setFailed).toHaveBeenCalledTimes(0);
    });

    test('handles zero registries', async () => {
        core.getState.mockReturnValue('');

        await cleanup();

        expect(core.getState).toHaveBeenCalledWith('registries');

        expect(exec.exec).toHaveBeenCalledTimes(0);
        expect(core.setFailed).toHaveBeenCalledTimes(0);
    });

    test('error is caught by core.setFailed for failed docker logout', async () => {
        exec.exec.mockReturnValue(1);

        await cleanup();

        expect(core.setFailed).toBeCalled();
    });

    test('continues to attempt logouts after a failed logout', async () => {
        core.getState.mockReturnValue(
            '123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com,222222222222.dkr.ecr.aws-region-1.amazonaws.com');
        exec.exec.mockReturnValueOnce(1).mockReturnValueOnce(1).mockReturnValueOnce(0);

        await cleanup();

        expect(core.getState).toHaveBeenCalledWith('registries');

        expect(exec.exec).toHaveBeenCalledTimes(3);
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

        expect(core.error).toHaveBeenCalledTimes(2);
        expect(core.error).toHaveBeenNthCalledWith(1, 'Could not logout registry 123456789012.dkr.ecr.aws-region-1.amazonaws.com: ');
        expect(core.error).toHaveBeenNthCalledWith(2, 'Could not logout registry 111111111111.dkr.ecr.aws-region-1.amazonaws.com: ');

        expect(core.setFailed).toHaveBeenCalledTimes(1);
        expect(core.setFailed).toHaveBeenCalledWith('Failed to logout: 123456789012.dkr.ecr.aws-region-1.amazonaws.com,111111111111.dkr.ecr.aws-region-1.amazonaws.com');
    });
});
