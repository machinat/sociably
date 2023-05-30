import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { Retweet } from '../Retweet.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof Retweet).toBe('function');
  expect(isNativeType(<Retweet tweetId="12345" />)).toBe(true);
  expect(Retweet.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Retweet tweetId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <Retweet
          tweetId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": {
            "method": "POST",
            "params": {
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
    {
      "method": "POST",
      "params": {
        "tweet_id": "12345",
      },
      "url": "2/users/67890/retweets",
    }
  `);
});
