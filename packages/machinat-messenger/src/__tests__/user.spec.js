import { MessengerUser, MessengerUserProfile } from '../user';

test('MessengerUser', () => {
  const user = new MessengerUser('_PAGE_ID_', 'foo');

  expect(user.platform).toBe('messenger');
  expect(user.pageId).toBe('_PAGE_ID_');
  expect(user.id).toBe('foo');
  expect(user.uid).toBe('messenger:_PAGE_ID_:foo');
});

test('MessengerUserProfile', () => {
  const rawProfile = {
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
  const profile = new MessengerUserProfile(rawProfile);

  expect(profile.id).toBe('xxxxxxxxx');
  expect(profile.name).toBe('Peter Chang');
  expect(profile.firstName).toBe('Peter');
  expect(profile.lastName).toBe('Chang');
  expect(profile.pictureURL).toBe(
    'https://fbcdn-profile-a.akamaihd.net/hprofile-ak-xpf1/v/t1.0-1/p200x200/13055603_10105219398495383_8237637584159975445_n.jpg?oh=1d241d4b6d4dac50eaf9bb73288ea192&oe=57AF5C03&__gda__=1470213755_ab17c8c8e3a0a447fed3f272fa2179ce'
  );
  expect(profile.locale).toBe('en_US');
  expect(profile.timezone).toBe(-7);
  expect(profile.gender).toBe('male');
  expect(profile.raw).toEqual(rawProfile);
});
