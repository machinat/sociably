import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { QuickReplyParam } from '../QuickReplyParam.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof QuickReplyParam).toBe('function');
  expect(isNativeType(<QuickReplyParam payload="" />)).toBe(true);
  expect(QuickReplyParam.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(renderPartElement(<QuickReplyParam payload="_HELLO_WORLD_" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <QuickReplyParam
          payload="_HELLO_WORLD_"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
          "index": undefined,
          "parameter": {
            "payload": "_HELLO_WORLD_",
            "type": "payload",
          },
          "type": "quick_reply",
        },
      },
    ]
  `);
});
