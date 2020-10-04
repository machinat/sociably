import moxy from '@moxyjs/moxy';
import MessengerUser from '../user';
import { MessengerProfiler } from '../profiler';

jest.useFakeTimers();

const state = moxy({
  get: async () => {},
  set: async () => false,
});

const stateController = moxy({
  userState: () => state,
});

const rawProfileData = {
  id: 'xxxxxxxxx',
  name: 'Peter Chang',
  first_name: 'Peter',
  last_name: 'Chang',
  profile_pic:
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
};

const bot = moxy({
  dispatchAPICall: async () => ({
    tasks: [
      /* ... */
    ],
    jobs: [
      /* ... */
    ],
    results: [{ code: 200, header: {}, body: rawProfileData }],
  }),
});

const user = new MessengerUser('_PAGE_ID_', '_USER_ID_');

beforeEach(() => {
  state.mock.reset();
  stateController.mock.reset();
  bot.mock.reset();
});

test('fetch profile from api and cache it', async () => {
  const profiler = new MessengerProfiler(bot, stateController);
  const profile = await profiler.getUserProfile(user);

  expect(profile.id).toBe('xxxxxxxxx');
  expect(profile.name).toBe('Peter Chang');
  expect(profile.firstName).toBe('Peter');
  expect(profile.lastName).toBe('Chang');
  expect(profile.pictureURL).toBe(
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce'
  );
  expect(profile.locale).toBe(undefined);
  expect(profile.timezone).toBe(undefined);
  expect(profile.gender).toBe(undefined);
  expect(profile.data).toEqual(rawProfileData);

  expect(bot.dispatchAPICall.mock).toHaveReturnedTimes(1);
  expect(bot.dispatchAPICall.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "GET",
      "_USER_ID_?fields=id,name,first_name,last_name,profile_pic",
    ]
  `);

  expect(stateController.userState.mock).toHaveReturnedTimes(2);
  expect(stateController.userState.mock).toHaveBeenCalledWith(user);

  expect(state.get.mock).toHaveReturnedTimes(1);
  expect(state.get.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `"$$messenger:user:profile"`
  );

  expect(state.set.mock).toHaveReturnedTimes(1);
  expect(state.set.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `"$$messenger:user:profile"`
  );
  expect(state.set.mock.calls[0].args[1]).toMatchInlineSnapshot(
    {
      data: {
        first_name: 'Peter',
        id: 'xxxxxxxxx',
        last_name: 'Chang',
        name: 'Peter Chang',
        profile_pic:
          'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
      },
      fetchAt: expect.any(Number),
    },
    `
    Object {
      "data": Object {
        "first_name": "Peter",
        "id": "xxxxxxxxx",
        "last_name": "Chang",
        "name": "Peter Chang",
        "profile_pic": "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce",
      },
      "fetchAt": Any<Number>,
    }
  `
  );
});

it('return with cached profile data if existed', async () => {
  const profiler = new MessengerProfiler(bot, stateController);

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
  const profiler = new MessengerProfiler(bot, stateController, {
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
    `"$$messenger:user:profile"`
  );
  expect(state.set.mock.calls[0].args[1]).toEqual({
    data: {
      first_name: 'Peter',
      id: 'xxxxxxxxx',
      last_name: 'Chang',
      name: 'Peter Chang',
      profile_pic:
        'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
    },
    fetchAt: expect.any(Number),
  });
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
  bot.dispatchAPICall.mock.fake(async () => ({
    tasks: [],
    jobs: [],
    results: [{ code: 200, headers: {}, body: profileWithMoreFields }],
  }));

  const profiler = new MessengerProfiler(bot, stateController, {
    optionalProfileFields: ['locale', 'timezone', 'gender'],
  });
  const profile = await profiler.getUserProfile(user);

  expect(profile.locale).toBe('en_US');
  expect(profile.timezone).toBe(-7);
  expect(profile.gender).toBe('male');
  expect(profile.data).toEqual(profileWithMoreFields);

  expect(bot.dispatchAPICall.mock).toHaveReturnedTimes(1);
  expect(bot.dispatchAPICall.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "GET",
      "_USER_ID_?fields=locale,timezone,gender,id,name,first_name,last_name,profile_pic",
    ]
  `);

  expect(state.set.mock).toHaveBeenCalledTimes(1);
  expect(state.set.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `"$$messenger:user:profile"`
  );
  expect(state.set.mock.calls[0].args[1]).toEqual({
    data: {
      first_name: 'Peter',
      gender: 'male',
      id: 'xxxxxxxxx',
      last_name: 'Chang',
      locale: 'en_US',
      name: 'Peter Chang',
      profile_pic:
        'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce',
      timezone: -7,
    },
    fetchAt: expect.any(Number),
  });
});