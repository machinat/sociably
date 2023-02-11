import TwitterUserProfile from '../UserProfile';
import { RawUser, RawSettings } from '../types';

const userData = {
  id: 6253282,
  id_str: '6253282',
  name: 'Twitter API',
  screen_name: 'TwitterAPI',
  location: 'San Francisco, CA',
  description:
    "The Real Twitter API. Tweets about API changes, service issues and our Developer Platform. Don't get an answer? It's on my website.",
  url: 'https://t.co/8IkCzCDr19',
  profile_image_url_https:
    'https://pbs.twimg.com/profile_images/942858479592554497/BbazLO9L_normal.jpg',
} as RawUser;

const settingsData = {
  language: 'en',
  screen_name: 'theSeanCook',
  time_zone: {
    name: 'Pacific Time (US & Canada)',
    tzinfo_name: 'America/Los_Angeles',
    utc_offset: -28800,
  },
} as RawSettings;

test('with user data only', () => {
  const profile = new TwitterUserProfile(userData);

  expect(profile.data).toEqual({
    user: userData,
    settings: undefined,
  });

  expect(profile.id).toBe('6253282');
  expect(profile.name).toBe('Twitter API');
  expect(profile.screenName).toBe('TwitterAPI');
  expect(profile.description).toBe(
    "The Real Twitter API. Tweets about API changes, service issues and our Developer Platform. Don't get an answer? It's on my website."
  );
  expect(profile.lastName).toBe(undefined);
  expect(profile.firstName).toBe(undefined);
  expect(profile.timeZone).toBe(undefined);
  expect(profile.languageCode).toBe(undefined);
  expect(profile.avatarUrl).toBe(
    'https://pbs.twimg.com/profile_images/942858479592554497/BbazLO9L_normal.jpg'
  );

  expect(profile.typeName()).toBe('TwtrUserProfile');
  expect(profile.toJSONValue()).toEqual({ user: userData });
});

test('with user data and settings data', () => {
  const profile = new TwitterUserProfile(userData, settingsData);

  expect(profile.data).toEqual({
    user: userData,
    settings: settingsData,
  });

  expect(profile.id).toBe('6253282');
  expect(profile.name).toBe('Twitter API');
  expect(profile.screenName).toBe('TwitterAPI');
  expect(profile.description).toBe(
    "The Real Twitter API. Tweets about API changes, service issues and our Developer Platform. Don't get an answer? It's on my website."
  );
  expect(profile.lastName).toBe(undefined);
  expect(profile.firstName).toBe(undefined);
  expect(profile.timeZone).toBe(-8);
  expect(profile.languageCode).toBe('en');
  expect(profile.avatarUrl).toBe(
    'https://pbs.twimg.com/profile_images/942858479592554497/BbazLO9L_normal.jpg'
  );

  expect(profile.typeName()).toBe('TwtrUserProfile');
  expect(profile.toJSONValue()).toEqual({
    user: userData,
    settings: settingsData,
  });
});

test('marshall type metadata', () => {
  expect(TwitterUserProfile.typeName).toBe('TwtrUserProfile');

  expect(
    TwitterUserProfile.fromJSONValue({ user: userData, settings: undefined })
  ).toStrictEqual(new TwitterUserProfile(userData));

  expect(
    TwitterUserProfile.fromJSONValue({ user: userData, settings: settingsData })
  ).toStrictEqual(new TwitterUserProfile(userData, settingsData));
});
