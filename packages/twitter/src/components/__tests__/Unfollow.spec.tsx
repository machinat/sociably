import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
import TweetTarget from '../../TweetTarget';
import { Unfollow } from '../Unfollow';

const renderer = new Renderer('twitter', async () => null);

it('is a valid Component', () => {
  expect(typeof Unfollow).toBe('function');
  expect(isNativeType(<Unfollow userId="12345" />)).toBe(true);
  expect(Unfollow.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderer.render(
    <Unfollow userId="12345" />,
    null,
    null
  );
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Unfollow
          userId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "2/users/:source_user_id/following/:target_user_id",
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
      "href": "2/users/67890/following/12345",
      "method": "DELETE",
      "parameters": null,
    }
  `);
});
