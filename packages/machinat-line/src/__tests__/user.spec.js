import { LineUser, LineUserProfile } from '../user';

test('LineUser ok', () => {
  const user = new LineUser('_USER_ID_');

  expect(user.platform).toBe('line');
  expect(user.id).toBe('_USER_ID_');
  expect(user.uid).toBe('line:*:_USER_ID_');
});

test('LineUserProfile ok', () => {
  const rawProfile = {
    displayName: 'LINE taro',
    userId: 'U4af4980629...',
    pictureUrl: 'https://obs.line-apps.com/...',
    statusMessage: 'Hello, LINE!',
  };
  const profile = new LineUserProfile(rawProfile);

  expect(profile.platform).toBe('line');
  expect(profile.name).toBe('LINE taro');
  expect(profile.id).toBe('U4af4980629...');
  expect(profile.pictureURL).toBe('https://obs.line-apps.com/...');
  expect(profile.statusMessage).toBe('Hello, LINE!');
  expect(profile.raw).toEqual(rawProfile);
});
