import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TweetTarget from '../../TweetTarget.js';
import { Like } from '../Like.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<Like tweetId="12345" />)).toBe(true);
  expect(Like.$$platform).toBe('twitter');
  expect(Like.$$name).toBe('Like');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Like tweetId="12345" />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <Like
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
            "url": "2/users/:id/likes",
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
      "url": "2/users/67890/likes",
    }
  `);
});
