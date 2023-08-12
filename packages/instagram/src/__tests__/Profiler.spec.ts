import { moxy } from '@moxyjs/moxy';
import type { InstagramBot } from '../Bot.js';
import InstagramPage from '../Page.js';
import InstagramUser from '../User.js';
import UserProfile from '../UserProfile.js';
import { InstagramProfiler } from '../Profiler.js';

const rawProfileData = {
  id: 'xxxxxxxxx',
  name: 'Peter Chang',
  username: 'peter.chang.3975',
  profile_pic:
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
  is_verified_user: false,
  follower_count: 123,
  is_user_follow_business: true,
  is_business_follow_user: false,
};

const bot = moxy<InstagramBot>({
  requestApi: async () => rawProfileData,
} as never);

const page = new InstagramPage('1234567890');
const user = new InstagramUser('1234567890', '_USER_ID_');

beforeEach(() => {
  bot.mock.reset();
});

test('fetch profile from api', async () => {
  const profiler = new InstagramProfiler(bot);
  const profile = await profiler.getUserProfile(page, user);

  expect(profile?.id).toBe('xxxxxxxxx');
  expect(profile?.name).toBe('Peter Chang');
  expect(profile?.firstName).toBe(undefined);
  expect(profile?.lastName).toBe(undefined);
  expect(profile?.avatarUrl).toBe(
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce'
  );
  expect(profile?.languageCode).toBe(undefined);
  expect(profile?.timeZone).toBe(undefined);
  expect(profile?.username).toBe('peter.chang.3975');
  expect(profile?.isVerifiedUser).toBe(false);
  expect(profile?.followerCount).toBe(123);
  expect(profile?.isUserFollowBusiness).toBe(true);
  expect(profile?.isBusinessFollowUser).toBe(false);
  expect(profile?.data).toEqual(rawProfileData);

  expect(bot.requestApi).toHaveReturnedTimes(1);
  expect(bot.requestApi.mock.calls[0].args[0]).toMatchInlineSnapshot(`
    {
      "method": "GET",
      "page": InstagramPage {
        "$$typeofChannel": true,
        "id": "1234567890",
        "platform": "instagram",
        "username": undefined,
      },
      "params": {
        "fields": "id,name,first_name,last_name,profile_pic",
      },
      "url": "_USER_ID_",
    }
  `);

  expect(profile?.typeName()).toBe('IgUserProfile');
  expect(profile?.toJSONValue()).toMatchInlineSnapshot(`
    {
      "follower_count": 123,
      "id": "xxxxxxxxx",
      "is_business_follow_user": false,
      "is_user_follow_business": true,
      "is_verified_user": false,
      "name": "Peter Chang",
      "profile_pic": "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce",
      "username": "peter.chang.3975",
    }
  `);
  expect(UserProfile.fromJSONValue(profile?.toJSONValue())).toStrictEqual(
    profile
  );
});
