import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import TweetTarget from '../../TweetTarget';
import { Like } from '../Like';

const renderer = new Renderer('twitter', async () => null);

it('is a valid Component', () => {
  expect(typeof Like).toBe('function');
  expect(isNativeType(<Like tweetId="12345" />)).toBe(true);
  expect(Like.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderer.render(<Like tweetId="12345" />, null, null);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Like
          tweetId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "2/users/:id/likes",
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
      "href": "2/users/67890/likes",
      "method": "POST",
      "parameters": Object {
        "tweet_id": "12345",
      },
    }
  `);
});
