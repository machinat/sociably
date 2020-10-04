import moxy from '@moxyjs/moxy';
import LineUser from '../user';
import { LineUserProfile, LineProfiler } from '../profiler';

jest.useFakeTimers();

const state = moxy({
  get: async () => {},
  set: async () => false,
});

const stateController = moxy({
  userState: () => state,
});

const rawProfileData = {
  displayName: 'LINE taro',
  userId: '__USER_ID__',
  language: 'en',
  pictureUrl: 'https://obs.line-apps.com/...',
  statusMessage: 'Hello, LINE!',
};

const bot = moxy({
  dispatchAPICall: async () => ({
    tasks: [
      /* ... */
    ],
    jobs: [
      /* ... */
    ],
    results: [rawProfileData],
  }),
});

const user = new LineUser('_PROVIDER_ID_', '_USER_ID_');

beforeEach(() => {
  state.mock.reset();
  stateController.mock.reset();
  bot.mock.reset();
});

test('fetch profile from api and cache it', async () => {
  const profiler = new LineProfiler(bot, stateController);
  const profile = await profiler.getUserProfile(user);

  expect(profile).toBeInstanceOf(LineUserProfile);

  expect(profile.platform).toBe('line');
  expect(profile.name).toBe('LINE taro');
  expect(profile.id).toBe('__USER_ID__');
  expect(profile.pictureURL).toBe('https://obs.line-apps.com/...');
  expect(profile.statusMessage).toBe('Hello, LINE!');
  expect(profile.data).toEqual(rawProfileData);

  expect(bot.dispatchAPICall.mock).toHaveReturnedTimes(1);
  expect(bot.dispatchAPICall.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "GET",
      "v2/bot/profile/_USER_ID_",
      null,
    ]
  `);

  expect(stateController.userState.mock).toHaveReturnedTimes(2);
  expect(stateController.userState.mock).toHaveBeenCalledWith(user);

  expect(state.get.mock).toHaveReturnedTimes(1);
  expect(state.get.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `"$$line:user:profile"`
  );

  expect(state.set.mock).toHaveReturnedTimes(1);
  expect(state.set.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `"$$line:user:profile"`
  );
  expect(state.set.mock.calls[0].args[1]).toEqual({
    data: {
      displayName: 'LINE taro',
      language: 'en',
      pictureUrl: 'https://obs.line-apps.com/...',
      statusMessage: 'Hello, LINE!',
      userId: '__USER_ID__',
    },
    fetchAt: expect.any(Number),
  });
});

it('return with cached profile data if existed', async () => {
  const profiler = new LineProfiler(bot, stateController);

  state.get.mock.fake(async () => ({
    data: rawProfileData,
    fetchAt: Date.now() - 3600,
  }));

  const profile = await profiler.getUserProfile(user);
  expect(profile.data).toEqual(rawProfileData);

  expect(state.get.mock).toHaveReturnedTimes(1);

  expect(bot.dispatchAPICall.mock).not.toHaveBeenCalled();
  expect(state.set.mock).not.toHaveBeenCalled();
});

it('update new profile data if profileCacheTime expired', async () => {
  const profiler = new LineProfiler(bot, stateController, {
    profileCacheTime: 99999999,
  });

  state.get.mock.fake(async () => ({
    data: rawProfileData,
    fetchAt: Date.now() - 100000000,
  }));

  const profile = await profiler.getUserProfile(user);
  expect(profile.data).toEqual(rawProfileData);

  expect(state.get.mock).toHaveReturnedTimes(1);
  expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(1);
  expect(state.set.mock).toHaveBeenCalledTimes(1);
  expect(state.set.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `"$$line:user:profile"`
  );
  expect(state.set.mock.calls[0].args[1]).toEqual({
    data: {
      displayName: 'LINE taro',
      language: 'en',
      pictureUrl: 'https://obs.line-apps.com/...',
      statusMessage: 'Hello, LINE!',
      userId: '__USER_ID__',
    },
    fetchAt: expect.any(Number),
  });
});