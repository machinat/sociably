import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import TwitterChat from '../../Chat.js';
import { Typing } from '../Typing.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof Typing).toBe('function');
  expect(isNativeType(<Typing />)).toBe(true);
  expect(Typing.$$platform).toBe('twitter');
});

test('rendering', async () => {
  const segments = await renderUnitElement(<Typing />);
  expect(segments).toMatchInlineSnapshot(`
    [
      {
        "node": <Typing />,
        "path": "$",
        "type": "unit",
        "value": {
          "accomplishRequest": [Function],
          "mediaSources": null,
          "request": {
            "method": "POST",
            "params": {
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
    {
      "method": "POST",
      "params": {
        "recipient_id": "67890",
      },
      "url": "1.1/direct_messages/indicate_typing.json",
    }
  `);
});
