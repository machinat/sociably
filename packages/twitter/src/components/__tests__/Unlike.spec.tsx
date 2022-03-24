import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import TweetTarget from '../../TweetTarget';
import { Unlike } from '../Unlike';

const renderer = new Renderer('twitter', async () => null);

it('is a valid Component', () => {
  expect(typeof Unlike).toBe('function');
  expect(isNativeType(<Unlike tweetId="12345" />)).toBe(true);
  expect(Unlike.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderer.render(
    <Unlike tweetId="12345" />,
    null,
    null
  );
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Unlike
          tweetId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "2/users/:id/likes/:tweet_id",
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
      "href": "2/users/67890/likes/12345",
      "method": "DELETE",
      "parameters": null,
    }
  `);
});
