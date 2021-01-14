import moxy from '@moxyjs/moxy';
import type { LineBot } from '../bot';
import LineUser from '../user';
import LineChat from '../channel';
import { LineProfiler, LineUserProfile, LineGroupProfile } from '../profiler';

const bot = moxy<LineBot>({
  makeApiCall: async () => ({}),
} as never);

beforeEach(() => {
  bot.mock.reset();
});

describe('#getUserProfile(user)', () => {
  const userProfileData = {
    displayName: 'LINE taro',
    userId: '_USER_ID_',
    language: 'en',
    pictureUrl: 'https://obs.line-apps.com/...',
    statusMessage: 'Hello, LINE!',
  };

  const user = new LineUser('_PROVIDER_ID_', '_USER_ID_');

  beforeEach(() => {
    bot.makeApiCall.mock.fake(async () => userProfileData);
  });

  it('fetch profile from api', async () => {
    const profiler = new LineProfiler(bot);

    const profile = await profiler.getUserProfile(user);
    expect(profile).toBeInstanceOf(LineUserProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('LINE taro');
    expect(profile.id).toBe('_USER_ID_');
    expect(profile.pictureUrl).toBe('https://obs.line-apps.com/...');
    expect(profile.statusMessage).toBe('Hello, LINE!');
    expect(profile.data).toEqual(userProfileData);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        "GET",
        "v2/bot/profile/_USER_ID_",
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
        "userId": "_USER_ID_",
      }
    `);
    expect(LineUserProfile.fromJSONValue(profileValue)).toStrictEqual(profile);
  });

  it('fetch group member profile', async () => {
    const profiler = new LineProfiler(bot);
    const group = new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_');

    const groupMemberData = {
      displayName: 'LINE taro',
      userId: '_USER_ID_',
      pictureUrl: 'https://obs.line-apps.com/...',
    };

    bot.makeApiCall.mock.fake(async () => groupMemberData);

    const profile = await profiler.getUserProfile(user, { inChat: group });
    expect(profile).toBeInstanceOf(LineUserProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('LINE taro');
    expect(profile.id).toBe('_USER_ID_');
    expect(profile.pictureUrl).toBe('https://obs.line-apps.com/...');
    expect(profile.statusMessage).toBe(undefined);
    expect(profile.data).toEqual(groupMemberData);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        "GET",
        "v2/bot/group/_GROUP_ID_/member/_USER_ID_",
      ]
    `);
  });

  it('fetch room member profile', async () => {
    const profiler = new LineProfiler(bot);
    const room = new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_');

    const roomMemberData = {
      displayName: 'LINE taro',
      userId: '_USER_ID_',
      pictureUrl: 'https://obs.line-apps.com/...',
    };

    bot.makeApiCall.mock.fake(async () => roomMemberData);

    const profile = await profiler.getUserProfile(user, { inChat: room });
    expect(profile).toBeInstanceOf(LineUserProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('LINE taro');
    expect(profile.id).toBe('_USER_ID_');
    expect(profile.pictureUrl).toBe('https://obs.line-apps.com/...');
    expect(profile.statusMessage).toBe(undefined);
    expect(profile.data).toEqual(roomMemberData);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        "GET",
        "v2/bot/room/_ROOM_ID_/member/_USER_ID_",
      ]
    `);
  });
});

describe('#getGroupProfile(user)', () => {
  const groupSummary = {
    groupId: '_GROUP_ID_',
    groupName: 'Group name',
    pictureUrl: 'https://profile.line-scdn.net/abcdefghijklmn',
  };

  const group = new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_');

  beforeEach(() => {
    bot.makeApiCall.mock.fake(async () => groupSummary);
  });

  it('fetch profile from api', async () => {
    const profiler = new LineProfiler(bot);

    const profile = await profiler.getGroupProfile(group as never);
    expect(profile).toBeInstanceOf(LineGroupProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('Group name');
    expect(profile.id).toBe('_GROUP_ID_');
    expect(profile.pictureUrl).toBe(
      'https://profile.line-scdn.net/abcdefghijklmn'
    );
    expect(profile.data).toEqual(groupSummary);

    expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
    expect(bot.makeApiCall.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        "GET",
        "v2/bot/group/_GROUP_ID_/summary",
      ]
    `);
  });

  test('profile object is marshallable', async () => {
    const profiler = new LineProfiler(bot);

    const profile = await profiler.getGroupProfile(group as never);
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
