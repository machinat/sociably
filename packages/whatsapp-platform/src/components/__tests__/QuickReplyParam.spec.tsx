import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { QuickReplyParam } from '../QuickReplyParam.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<QuickReplyParam payload="" />)).toBe(true);
  expect(QuickReplyParam.$$platform).toBe('whatsapp');
  expect(QuickReplyParam.$$name).toBe('QuickReplyParam');
});

test('rendering value', async () => {
  await expect(renderPartElement(<QuickReplyParam payload="_HELLO_WORLD_" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <QuickReplyParam
          payload="_HELLO_WORLD_"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "index": undefined,
          "parameters": [
            {
              "payload": "_HELLO_WORLD_",
              "type": "payload",
            },
          ],
          "sub_type": "quick_reply",
          "type": "button",
        },
      },
    ]
  `);
});
