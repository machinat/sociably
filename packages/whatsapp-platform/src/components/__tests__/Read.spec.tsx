import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Read } from '../Read.js';
import { renderUnitElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<Read messageId="..." />)).toBe(true);
  expect(Read.$$platform).toBe('whatsapp');
  expect(Read.$$name).toBe('Read');
});

test('rendering value', async () => {
  await expect(renderUnitElement(<Read messageId="MESSAGE_ID_TO_READ" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <Read
          messageId="MESSAGE_ID_TO_READ"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "message": {
            "message_id": "MESSAGE_ID_TO_READ",
            "messaging_product": "whatsapp",
            "status": "read",
          },
        },
      },
    ]
  `);
});
