import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { CancelRetweet } from '../CancelRetweet.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof CancelRetweet).toBe('function');
  expect(isNativeType(<CancelRetweet tweetId="12345" />)).toBe(true);
  expect(CancelRetweet.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<CancelRetweet tweetId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <CancelRetweet
          tweetId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": {
            "method": "DELETE",
            "params": {},
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
    {
      "method": "DELETE",
      "params": {},
      "url": "2/users/67890/retweets/12345",
    }
  `);
});
