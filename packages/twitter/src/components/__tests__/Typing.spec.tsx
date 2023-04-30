import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TwitterChat from '../../Chat';
import { Typing } from '../Typing';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Typing).toBe('function');
  expect(isNativeType(<Typing />)).toBe(true);
  expect(Typing.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Typing />);
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
            "method": "POST",
            "params": Object {
              "recipient_id": "",
            },
            "url": "1.1/direct_messages/indicate_typing.json",
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
      "method": "POST",
      "params": Object {
        "recipient_id": "67890",
      },
      "url": "1.1/direct_messages/indicate_typing.json",
    }
  `);
});
