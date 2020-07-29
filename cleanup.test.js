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
            'docker logout',
            ['123456789012.dkr.ecr.aws-region-1.amazonaws.com'],
            expect.anything());
        expect(exec.exec).toHaveBeenNthCalledWith(2,
            'docker logout',
            ['111111111111.dkr.ecr.aws-region-1.amazonaws.com'],
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
});
