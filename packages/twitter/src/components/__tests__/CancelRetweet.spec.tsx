import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget';
import { CancelRetweet } from '../CancelRetweet';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof CancelRetweet).toBe('function');
  expect(isNativeType(<CancelRetweet tweetId="12345" />)).toBe(true);
  expect(CancelRetweet.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<CancelRetweet tweetId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <CancelRetweet
          tweetId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "method": "DELETE",
            "params": Object {},
            "url": "2/users/:id/retweets/:source_tweet_id",
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
      "method": "DELETE",
      "params": Object {},
      "url": "2/users/67890/retweets/12345",
    }
  `);
});
