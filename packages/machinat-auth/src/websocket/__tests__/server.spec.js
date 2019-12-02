import moxy from 'moxy';
import verifyAuth from '../server';

const authContext = {
  platform: 'some_platform',
  user: { john: 'doe' },
  channel: null,
  loginAt: new Date(),
  expireAt: new Date(Date.now() + 9999),
  data: { foo: 'bar' },
};

const controller = moxy({
  async verifyHTTPAuthorization() {
    return authContext;
  },
});

const request = {
  url: '/hello',
  method: 'GET',
  headers: { the: 'world' },
};

beforeEach(() => {
  controller.mock.reset();
});

it('resolve accepted if verifyHTTPAuthorization() resolve', async () => {
  await expect(
    verifyAuth(controller)(request, { token: '_TOKEN_' })
  ).resolves.toEqual({
    accepted: true,
    user: authContext.user,
    expireAt: authContext.expireAt,
    context: authContext,
  });
});

it('resolve unaccepted if verifyHTTPAuthorization() reject', async () => {
  controller.verifyHTTPAuthorization.mock.fake(async () => {
    throw new Error('verfication fail');
  });

  await expect(
    verifyAuth(controller)(request, { token: '_TOKEN_' })
  ).resolves.toEqual({
    accepted: false,
    reason: 'verfication fail',
  });
});
