import moxy from '@moxyjs/moxy';
import MessengerUser from '../user';
import { MessengerProfiler, MessengerUserProfile } from '../profiler';

const rawProfileData = {
  id: 'xxxxxxxxx',
  name: 'Peter Chang',
  first_name: 'Peter',
  last_name: 'Chang',
  profile_pic:
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
};

const bot = moxy({
  makeApiCall: async () => ({
    code: 200,
    header: {},
    body: rawProfileData,
  }),
});

const user = new MessengerUser('_PAGE_ID_', '_USER_ID_');

beforeEach(() => {
  bot.mock.reset();
});

test('fetch profile from api', async () => {
  const profiler = new MessengerProfiler(bot);
  const profile = await profiler.getUserProfile(user);

  expect(profile.id).toBe('xxxxxxxxx');
  expect(profile.name).toBe('Peter Chang');
  expect(profile.firstName).toBe('Peter');
  expect(profile.lastName).toBe('Chang');
  expect(profile.pictureUrl).toBe(
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce'
  );
  expect(profile.locale).toBe(undefined);
  expect(profile.timezone).toBe(undefined);
  expect(profile.gender).toBe(undefined);
  expect(profile.data).toEqual(rawProfileData);

  expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
  expect(bot.makeApiCall.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "GET",
      "_USER_ID_?fields=id,name,first_name,last_name,profile_pic",
    ]
  `);

  expect(profile.typeName()).toBe('MessengerUserProfile');
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
    MessengerUserProfile.fromJSONValue(profile.toJSONValue())
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
  bot.makeApiCall.mock.fake(async () => ({
    code: 200,
    headers: {},
    body: profileWithMoreFields,
  }));

  const profiler = new MessengerProfiler(bot, {
    optionalProfileFields: ['locale', 'timezone', 'gender'],
  });
  const profile = await profiler.getUserProfile(user);

  expect(profile.locale).toBe('en_US');
  expect(profile.timezone).toBe(-7);
  expect(profile.gender).toBe('male');
  expect(profile.data).toEqual(profileWithMoreFields);

  expect(bot.makeApiCall.mock).toHaveReturnedTimes(1);
  expect(bot.makeApiCall.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "GET",
      "_USER_ID_?fields=locale,timezone,gender,id,name,first_name,last_name,profile_pic",
    ]
  `);

  expect(profile.typeName()).toBe('MessengerUserProfile');
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
    MessengerUserProfile.fromJSONValue(profile.toJSONValue())
  ).toStrictEqual(profile);
});
