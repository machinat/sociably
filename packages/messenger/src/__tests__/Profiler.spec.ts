import moxy from '@moxyjs/moxy';
import type { MessengerBot } from '../Bot';
import FacebookUser from '../User';
import FacebookUserProfile from '../UserProfile';
import { MessengerProfiler } from '../Profiler';
import GraphApiError from '../Error';

const rawProfileData = {
  id: 'xxxxxxxxx',
  name: 'Peter Chang',
  first_name: 'Peter',
  last_name: 'Chang',
  profile_pic:
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
};

const bot = moxy<MessengerBot>({
  makeApiCall: async () => rawProfileData,
} as never);

const user = new FacebookUser('1234567890', '_USER_ID_');

beforeEach(() => {
  bot.mock.reset();
});

test('fetch profile from api', async () => {
  const profiler = new MessengerProfiler(bot);
  const profile = (await profiler.getUserProfile(user))!;

  expect(profile.id).toBe('xxxxxxxxx');
  expect(profile.name).toBe('Peter Chang');
  expect(profile.firstName).toBe('Peter');
  expect(profile.lastName).toBe('Chang');
  expect(profile.avatarUrl).toBe(
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce'
  );
  expect(profile.languageCode).toBe(undefined);
  expect(profile.timeZone).toBe(undefined);
  expect(profile.gender).toBe(undefined);
  expect(profile.data).toEqual(rawProfileData);

  expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
  expect(bot.makeApiCall.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "GET",
      "_USER_ID_?fields=id,name,first_name,last_name,profile_pic",
    ]
  `);

  expect(profile.typeName()).toBe('FacebookUserProfile');
  expect(profile.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "first_name": "Peter",
      "id": "xxxxxxxxx",
      "last_name": "Chang",
      "name": "Peter Chang",
      "profile_pic": "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce",
    }
  `);
  expect(
    FacebookUserProfile.fromJSONValue(profile.toJSONValue())
  ).toStrictEqual(profile);
});

it('query additional optionalProfileFields if given', async () => {
  const profileWithMoreFields = {
    id: 'xxxxxxxxx',
    name: 'Peter Chang',
    first_name: 'Peter',
    last_name: 'Chang',
    profile_pic:
      'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
    locale: 'en_US',
    timezone: -7,
    gender: 'male',
  };
  bot.makeApiCall.mock.fake(async () => profileWithMoreFields);

  const profiler = new MessengerProfiler(bot, {
    optionalProfileFields: ['locale', 'timezone', 'gender'],
  });
  const profile = (await profiler.getUserProfile(user))!;

  expect(profile.languageCode).toBe('en_US');
  expect(profile.timeZone).toBe(-7);
  expect(profile.gender).toBe('male');
  expect(profile.data).toEqual(profileWithMoreFields);

  expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
  expect(bot.makeApiCall.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "GET",
      "_USER_ID_?fields=locale,timezone,gender,id,name,first_name,last_name,profile_pic",
    ]
  `);

  expect(profile.typeName()).toBe('FacebookUserProfile');
  expect(profile.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "first_name": "Peter",
      "gender": "male",
      "id": "xxxxxxxxx",
      "last_name": "Chang",
      "locale": "en_US",
      "name": "Peter Chang",
      "profile_pic": "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce",
      "timezone": -7,
    }
  `);
  expect(
    FacebookUserProfile.fromJSONValue(profile.toJSONValue())
  ).toStrictEqual(profile);
});

it('return null if phone number user error met', async () => {
  const profiler = new MessengerProfiler(bot);

  bot.makeApiCall.mock.fake(async () => {
    throw new GraphApiError({
      error: {
        message: '(#100) No profile available for this user.',
        type: 'OAuthException',
        code: 100,
        error_subcode: 2018218,
        fbtrace_id: 'G2oz2QE++k1',
      },
    });
  });

  expect(profiler.getUserProfile(user)).resolves.toBe(null);
  expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
});
