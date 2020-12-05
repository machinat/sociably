import moxy from '@moxyjs/moxy';
import LineUser from '../user';
import LineChat from '../channel';
import { LineProfiler, LineUserProfile, LineGroupProfile } from '../profiler';

describe('#getUserProfile(user)', () => {
  const rawProfileData = {
    displayName: 'LINE taro',
    userId: '__USER_ID__',
    language: 'en',
    pictureUrl: 'https://obs.line-apps.com/...',
    statusMessage: 'Hello, LINE!',
  };

  const bot = moxy({
    dispatchAPICall: async () => ({
      code: 200,
      headers: {},
      body: rawProfileData,
    }),
  });

  const user = new LineUser('_PROVIDER_ID_', '_USER_ID_');

  beforeEach(() => {
    bot.mock.reset();
  });

  it('fetch profile from api', async () => {
    const profiler = new LineProfiler(bot);
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
  });

  test('profile object is marshallable', async () => {
    const profiler = new LineProfiler(bot);
    const profile = await profiler.getUserProfile(user);

    expect(profile.typeName()).toBe('LineUserProfile');

    const profileValue = profile.toJSONValue();
    expect(profileValue).toMatchInlineSnapshot(`
      Object {
        "displayName": "LINE taro",
        "language": "en",
        "pictureUrl": "https://obs.line-apps.com/...",
        "statusMessage": "Hello, LINE!",
        "userId": "__USER_ID__",
      }
    `);
    expect(LineUserProfile.fromJSONValue(profileValue)).toStrictEqual(profile);
  });
});

describe('#getGroupProfile(user)', () => {
  const groupSummary = {
    groupId: '_GROUP_ID_',
    groupName: 'Group name',
    pictureUrl: 'https://profile.line-scdn.net/abcdefghijklmn',
  };

  const bot = moxy({
    dispatchAPICall: async () => ({
      code: 200,
      headers: {},
      body: groupSummary,
    }),
  });

  const group = new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_');

  beforeEach(() => {
    bot.mock.reset();
  });

  it('fetch profile from api', async () => {
    const profiler = new LineProfiler(bot);
    const profile = await profiler.getGroupProfile(group);

    expect(profile).toBeInstanceOf(LineGroupProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('Group name');
    expect(profile.id).toBe('_GROUP_ID_');
    expect(profile.pictureURL).toBe(
      'https://profile.line-scdn.net/abcdefghijklmn'
    );
    expect(profile.data).toEqual(groupSummary);

    expect(bot.dispatchAPICall.mock).toHaveReturnedTimes(1);
    expect(bot.dispatchAPICall.mock.calls[0].args).toMatchInlineSnapshot(`
          Array [
            "GET",
            "v2/bot/group/_GROUP_ID_/summary",
            null,
          ]
      `);
  });

  test('profile object is marshallable', async () => {
    const profiler = new LineProfiler(bot);
    const profile = await profiler.getGroupProfile(group);

    expect(profile.typeName()).toBe('LineGroupProfile');

    const profileValue = profile.toJSONValue();
    expect(profileValue).toMatchInlineSnapshot(`
      Object {
        "groupId": "_GROUP_ID_",
        "groupName": "Group name",
        "pictureUrl": "https://profile.line-scdn.net/abcdefghijklmn",
      }
    `);
    expect(LineGroupProfile.fromJSONValue(profileValue)).toStrictEqual(profile);
  });
});
