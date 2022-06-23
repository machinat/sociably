import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import TweetTarget from '../../TweetTarget';
import { Unblock } from '../Unblock';

const renderer = new Renderer('twitter', async () => null);

it('is a valid Component', () => {
  expect(typeof Unblock).toBe('function');
  expect(isNativeType(<Unblock userId="12345" />)).toBe(true);
  expect(Unblock.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderer.render(
    <Unblock userId="12345" />,
    null,
    null
  );
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Unblock
          userId="12345"
        />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "2/users/:source_user_id/blocking/:target_user_id",
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
      "href": "2/users/67890/blocking/12345",
      "method": "DELETE",
      "parameters": null,
    }
  `);
});
