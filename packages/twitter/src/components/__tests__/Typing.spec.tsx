import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import TwitterChat from '../../Chat';
import { Typing } from '../Typing';

const renderer = new Renderer('twitter', async () => null);

it('is a valid Component', () => {
  expect(typeof Typing).toBe('function');
  expect(isNativeType(<Typing />)).toBe(true);
  expect(Typing.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderer.render(<Typing />, null, null);
  expect(segments).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <Typing />,
        "path": "$",
        "type": "unit",
        "value": Object {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": Object {
            "href": "1.1/direct_messages/indicate_typing.json",
            "method": "POST",
            "parameters": Object {
              "recipient_id": "",
            },
          },
          "type": "dm",
        },
      },
    ]
  `);

  const { request, accomplishRequest } = (segments as any)[0].value;
  expect(accomplishRequest(new TwitterChat('12345', '67890'), request, null))
    .toMatchInlineSnapshot(`
    Object {
      "href": "1.1/direct_messages/indicate_typing.json",
      "method": "POST",
      "parameters": Object {
        "recipient_id": "67890",
      },
    }
  `);
});
