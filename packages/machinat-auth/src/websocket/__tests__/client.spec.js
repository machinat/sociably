import moxy from 'moxy';
import registerAuth from '../client';

const authContext = {
  platform: 'some_platform',
  user: { john: 'doe' },
  channel: null,
  loginAt: new Date(),
  expireAt: new Date(Date.now() + 9999),
  data: { foo: 'bar' },
};

const controller = moxy({
  authContext,
  auth() {
    return authContext;
  },
  getToken() {
    return '_TOKEN_';
  },
});

beforeEach(() => {
  controller.mock.reset();
});

it('resolve when user is signed in', async () => {
  await expect(registerAuth(controller)()).resolves.toEqual({
    user: authContext.user,
    data: { token: '_TOKEN_' },
  });

  expect(controller.auth.mock).not.toHaveBeenCalled();
  expect(controller.getToken.mock).toHaveBeenCalledTimes(1);
});

it('call auth() to sign in then resolve if not yet', async () => {
  controller.mock.getter('authContext').fakeReturnValue(null);

  await expect(registerAuth(controller)()).resolves.toEqual({
    user: authContext.user,
    data: { token: '_TOKEN_' },
  });

  expect(controller.auth.mock).toHaveBeenCalledTimes(1);
  expect(controller.getToken.mock).toHaveBeenCalledTimes(1);
});

it('reject if auth() thrown', async () => {
  controller.mock.getter('authContext').fakeReturnValue(null);
  controller.auth.mock.fake(() => {
    throw Error('bad auth');
  });

  await expect(registerAuth(controller)()).rejects.toThrowError('bad auth');

  expect(controller.auth.mock).toHaveBeenCalledTimes(1);
  expect(controller.getToken.mock).not.toHaveBeenCalled();
});
