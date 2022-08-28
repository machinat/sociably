import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Read } from '../Read';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Read).toBe('function');
  expect(isNativeType(<Read messageId="..." />)).toBe(true);
  expect(Read.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(renderUnitElement(<Read messageId="MESSAGE_ID_TO_READ" />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ReadProps
                messageId="MESSAGE_ID_TO_READ"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "message_id": "MESSAGE_ID_TO_READ",
                  "messaging_product": "whatsapp",
                  "status": "read",
                },
              },
            },
          ]
        `);
});
