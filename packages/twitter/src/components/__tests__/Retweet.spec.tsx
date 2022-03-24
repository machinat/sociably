import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import TweetTarget from '../../TweetTarget';
import { Retweet } from '../Retweet';

const renderer = new Renderer('twitter', async () => null);

it('is a valid Component', () => {
  expect(typeof Retweet).toBe('function');
  expect(isNativeType(<Retweet tweetId="12345" />)).toBe(true);
  expect(Retweet.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderer.render(
    <Retweet tweetId="12345" />,
    null,
    null
  );
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
            "href": "2/users/:id/retweets",
            "method": "POST",
            "parameters": Object {
              "tweet_id": "12345",
            },
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
      "href": "2/users/67890/retweets",
      "method": "POST",
      "parameters": Object {
        "tweet_id": "12345",
      },
    }
  `);
});
