import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import TweetTarget from '../../TweetTarget';
import { Block } from '../Block';

const renderer = new Renderer('twitter', async () => null);

it('is a valid Component', () => {
  expect(typeof Block).toBe('function');
  expect(isNativeType(<Block userId="12345" />)).toBe(true);
  expect(Block.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderer.render(<Block userId="12345" />, null, null);
  expect(segments).toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Block
                userId="12345"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "accomplishRequest": [Function],
                "mediaSources": null,
                "request": Object {
                  "href": "2/users/:id/blocking",
                  "method": "POST",
                  "parameters": Object {
                    "target_user_id": "12345",
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
      "href": "2/users/67890/blocking",
      "method": "POST",
      "parameters": Object {
        "target_user_id": "12345",
      },
    }
  `);
});
