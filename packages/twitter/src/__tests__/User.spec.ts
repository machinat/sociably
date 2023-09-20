import TwitterUser from '../User.js';
import TwitterUserProfile from '../UserProfile.js';
import { RawUser } from '../types.js';

const userData = {
  id: 6253282,
  id_str: '6253282',
  name: 'Twitter API',
  screen_name: 'TwitterAPI',
  location: 'San Francisco, CA',
  description:
    "The Real Twitter API. Tweets about API changes, service issues and our Developer Platform. Don't get an answer? It's on my website.",
  url: 'https://t.co/8IkCzCDr19',
  user_image_url_https:
    'https://pbs.twimg.com/user_images/942858479592554497/BbazLO9L_normal.jpg',
} as unknown as RawUser;

test('with id only', () => {
  const user = new TwitterUser('6253282');

  expect(user.id).toBe('6253282');
  expect(user.data).toBe(null);
  expect(user.profile).toBe(null);

  expect(user.uid).toBe('twtr.6253282');
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": "6253282",
      "platform": "twitter",
    }
  `);

  expect(user.typeName()).toBe('TwtrUser');
  expect(user.toJSONValue()).toEqual({ id: '6253282' });
});

test('with user data', () => {
  const user = new TwitterUser('6253282', userData);

  expect(user.id).toBe('6253282');
  expect(user.data).toEqual(userData);
  expect(user.profile).toStrictEqual(new TwitterUserProfile(userData));

  expect(user.uid).toBe('twtr.6253282');
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": "6253282",
      "platform": "twitter",
    }
  `);

  expect(user.typeName()).toBe('TwtrUser');
  expect(user.toJSONValue()).toEqual({ id: '6253282' });
});

test('marshall type metadata', () => {
  expect(TwitterUser.typeName).toBe('TwtrUser');

  expect(TwitterUser.fromJSONValue({ id: '6253282' })).toStrictEqual(
    new TwitterUser('6253282'),
  );
});
