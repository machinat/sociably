import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget';
import { Retweet } from '../Retweet';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Retweet).toBe('function');
  expect(isNativeType(<Retweet tweetId="12345" />)).toBe(true);
  expect(Retweet.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Retweet tweetId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Retweet
          tweetId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "method": "POST",
            "params": Object {
              "tweet_id": "12345",
            },
            "url": "2/users/:id/retweets",
          },
          "type": "action",
        },
      },
    ]
  `);
  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TweetTarget('67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "method": "POST",
      "params": Object {
        "tweet_id": "12345",
      },
      "url": "2/users/67890/retweets",
    }
  `);
});
