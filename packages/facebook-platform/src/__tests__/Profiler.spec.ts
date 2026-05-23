import moxy from '@moxyjs/moxy';
import { MetaApiError } from '@sociably/meta-api';
import type { FacebookSender } from '../Sender.js';
import FacebookPage from '../Page.js';
import FacebookUser from '../User.js';
import UserProfile from '../UserProfile.js';
import { FacebookProfiler } from '../Profiler.js';

const rawProfileData = {
  id: 'xxxxxxxxx',
  name: 'Peter Chang',
  first_name: 'Peter',
  last_name: 'Chang',
  profile_pic:
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
};

const sender = moxy<FacebookSender>({
  requestApi: async () => rawProfileData,
} as never);

const page = new FacebookPage('1234567890');
const user = new FacebookUser('1234567890', '_USER_ID_');

beforeEach(() => {
  sender.mock.reset();
});

test('fetch profile from api', async () => {
  const profiler = new FacebookProfiler(sender);
  const profile = await profiler.getUserProfile(page, user);

  expect(profile?.id).toBe('xxxxxxxxx');
  expect(profile?.name).toBe('Peter Chang');
  expect(profile?.firstName).toBe('Peter');
  expect(profile?.lastName).toBe('Chang');
  expect(profile?.avatarUrl).toBe(
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
  );
  expect(profile?.languageCode).toBe(undefined);
  expect(profile?.timeZone).toBe(undefined);
  expect(profile?.gender).toBe(undefined);
  expect(profile?.data).toEqual(rawProfileData);

  expect(sender.requestApi).toHaveReturnedTimes(1);
  expect(sender.requestApi.mock.calls[0].args[0]).toMatchInlineSnapshot(`
    {
      "agent": FacebookPage {
        "$$typeofAgent": true,
        "id": "1234567890",
        "platform": "facebook",
      },
      "method": "GET",
      "params": {
        "fields": "id,name,first_name,last_name,profile_pic",
      },
      "url": "_USER_ID_",
    }
  `);

  expect(profile?.typeName()).toBe('FacebookUserProfile');
  expect(profile?.toJSONValue()).toMatchInlineSnapshot(`
    {
      "first_name": "Peter",
      "id": "xxxxxxxxx",
      "last_name": "Chang",
      "name": "Peter Chang",
      "profile_pic": "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce",
    }
  `);
  expect(UserProfile.fromJSONValue(profile!.toJSONValue())).toStrictEqual(
    profile,
  );
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
  sender.requestApi.mock.fake(async () => profileWithMoreFields);

  const profiler = new FacebookProfiler(sender, {
    optionalProfileFields: ['locale', 'timezone', 'gender'],
  });
  const profile = await profiler.getUserProfile(page, user);

  expect(profile?.languageCode).toBe('en_US');
  expect(profile?.timeZone).toBe(-7);
  expect(profile?.gender).toBe('male');
  expect(profile?.data).toEqual(profileWithMoreFields);

  expect(sender.requestApi).toHaveReturnedTimes(1);
  expect(sender.requestApi.mock.calls[0].args[0]).toMatchInlineSnapshot(`
    {
      "agent": FacebookPage {
        "$$typeofAgent": true,
        "id": "1234567890",
        "platform": "facebook",
      },
      "method": "GET",
      "params": {
        "fields": "locale,timezone,gender,id,name,first_name,last_name,profile_pic",
      },
      "url": "_USER_ID_",
    }
  `);

  expect(profile?.typeName()).toBe('FacebookUserProfile');
  expect(profile?.toJSONValue()).toMatchInlineSnapshot(`
    {
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
  expect(UserProfile.fromJSONValue(profile!.toJSONValue())).toStrictEqual(
    profile,
  );
});

it('return null if phone number user error met', async () => {
  const profiler = new FacebookProfiler(sender);

  sender.requestApi.mock.fake(async () => {
    throw new MetaApiError({
      error: {
        message: '(#100) No profile available for this user.',
        type: 'OAuthException',
        code: 100,
        error_subcode: 2018218,
        fbtrace_id: 'G2oz2QE++k1',
      },
    });
  });

  expect(profiler.getUserProfile(page, user)).resolves.toBe(null);
  expect(sender.requestApi).toHaveReturnedTimes(1);
});
