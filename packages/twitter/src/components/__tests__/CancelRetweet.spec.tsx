import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import TweetTarget from '../../TweetTarget';
import { CancelRetweet } from '../CancelRetweet';

const renderer = new Renderer('twitter', async () => null);

it('is a valid Component', () => {
  expect(typeof CancelRetweet).toBe('function');
  expect(isNativeType(<CancelRetweet tweetId="12345" />)).toBe(true);
  expect(CancelRetweet.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderer.render(
    <CancelRetweet tweetId="12345" />,
    null,
    null
  );
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
            "href": "2/users/:id/retweets/:source_tweet_id",
            "method": "DELETE",
            "parameters": null,
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
      "href": "2/users/67890/retweets/12345",
      "method": "DELETE",
      "parameters": null,
    }
  `);
});
