import { moxy } from '@moxyjs/moxy';
import type { LineBot } from '../Bot.js';
import LineChannel from '../Channel.js';
import LineUser from '../User.js';
import LineChat from '../Chat.js';
import LineUserProfile from '../UserProfile.js';
import LineGroupProfile from '../GroupProfile.js';
import { LineProfiler } from '../Profiler.js';

const bot = moxy<LineBot>({
  requestApi: async () => ({}),
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

  const channel = new LineChannel('_CHANNEL_ID_');
  const user = new LineUser('_PROVIDER_ID_', '_USER_ID_');

  beforeEach(() => {
    bot.requestApi.mock.fake(async () => userProfileData);
  });

  it('fetch profile from api', async () => {
    const profiler = new LineProfiler(bot);

    const profile = await profiler.getUserProfile(channel, user);
    expect(profile).toBeInstanceOf(LineUserProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('LINE taro');
    expect(profile.id).toBe('_USER_ID_');
    expect(profile.avatarUrl).toBe('https://obs.line-apps.com/...');
    expect(profile.statusMessage).toBe('Hello, LINE!');
    expect(profile.languageCode).toBe('en');
    expect(profile.data).toEqual(userProfileData);

    expect(bot.requestApi).toHaveReturnedTimes(1);
    expect(bot.requestApi.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      {
        "channel": LineChannel {
          "$$typeofChannel": true,
          "id": "_CHANNEL_ID_",
          "platform": "line",
        },
        "method": "GET",
        "url": "v2/bot/profile/_USER_ID_",
      }
    `);
  });

  test('profile object is marshallable', async () => {
    const profiler = new LineProfiler(bot);
    const profile = await profiler.getUserProfile(channel, user);

    expect(profile.typeName()).toBe('LineUserProfile');

    const profileValue = profile.toJSONValue();
    expect(profileValue).toMatchInlineSnapshot(`
      {
        "data": {
          "displayName": "LINE taro",
          "language": "en",
          "pictureUrl": "https://obs.line-apps.com/...",
          "statusMessage": "Hello, LINE!",
          "userId": "_USER_ID_",
        },
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

    bot.requestApi.mock.fake(async () => groupMemberData);

    const profile = await profiler.getUserProfile(channel, user, {
      inChat: group,
    });
    expect(profile).toBeInstanceOf(LineUserProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('LINE taro');
    expect(profile.id).toBe('_USER_ID_');
    expect(profile.avatarUrl).toBe('https://obs.line-apps.com/...');
    expect(profile.statusMessage).toBe(undefined);
    expect(profile.languageCode).toBe(undefined);
    expect(profile.data).toEqual(groupMemberData);

    expect(bot.requestApi).toHaveReturnedTimes(1);
    expect(bot.requestApi.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      {
        "channel": LineChannel {
          "$$typeofChannel": true,
          "id": "_CHANNEL_ID_",
          "platform": "line",
        },
        "method": "GET",
        "url": "v2/bot/group/_GROUP_ID_/member/_USER_ID_",
      }
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

    bot.requestApi.mock.fake(async () => roomMemberData);

    const profile = await profiler.getUserProfile(channel, user, {
      inChat: room,
    });
    expect(profile).toBeInstanceOf(LineUserProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('LINE taro');
    expect(profile.id).toBe('_USER_ID_');
    expect(profile.avatarUrl).toBe('https://obs.line-apps.com/...');
    expect(profile.statusMessage).toBe(undefined);
    expect(profile.languageCode).toBe(undefined);
    expect(profile.data).toEqual(roomMemberData);

    expect(bot.requestApi).toHaveReturnedTimes(1);
    expect(bot.requestApi.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      {
        "channel": LineChannel {
          "$$typeofChannel": true,
          "id": "_CHANNEL_ID_",
          "platform": "line",
        },
        "method": "GET",
        "url": "v2/bot/room/_ROOM_ID_/member/_USER_ID_",
      }
    `);
  });
});

describe('#getGroupProfile(user)', () => {
  const groupSummary = {
    groupId: '_GROUP_ID_',
    groupName: 'Group name',
    pictureUrl: 'https://profile.line-scdn.net/abcdefghijklmn',
  };

  const channel = new LineChannel('_CHANNEL_ID_');
  const group = new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_');

  beforeEach(() => {
    bot.requestApi.mock.fake(async () => groupSummary);
  });

  it('fetch profile from api', async () => {
    const profiler = new LineProfiler(bot);

    const profile = await profiler.getGroupProfile(channel, group);
    expect(profile).toBeInstanceOf(LineGroupProfile);

    expect(profile.platform).toBe('line');
    expect(profile.name).toBe('Group name');
    expect(profile.id).toBe('_GROUP_ID_');
    expect(profile.avatarUrl).toBe(
      'https://profile.line-scdn.net/abcdefghijklmn'
    );
    expect(profile.data).toEqual(groupSummary);

    expect(bot.requestApi).toHaveReturnedTimes(1);
    expect(bot.requestApi.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      {
        "channel": LineChannel {
          "$$typeofChannel": true,
          "id": "_CHANNEL_ID_",
          "platform": "line",
        },
        "method": "GET",
        "url": "v2/bot/group/_GROUP_ID_/summary",
      }
    `);
  });

  test('profile object is marshallable', async () => {
    const profiler = new LineProfiler(bot);

    const profile = await profiler.getGroupProfile(channel, group);
    expect(profile.typeName()).toBe('LineGroupProfile');

    const profileValue = profile.toJSONValue();
    expect(profileValue).toMatchInlineSnapshot(`
      {
        "data": {
          "groupId": "_GROUP_ID_",
          "groupName": "Group name",
          "pictureUrl": "https://profile.line-scdn.net/abcdefghijklmn",
        },
      }
    `);
    expect(LineGroupProfile.fromJSONValue(profileValue)).toStrictEqual(profile);
  });
});
