import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MarkSeen } from '../MarkSeen';
import { renderUnitElement } from './utils';

it('is valid unit Component', () => {
  expect(typeof MarkSeen).toBe('function');
  expect(isNativeType(<MarkSeen />)).toBe(true);
  expect(MarkSeen.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<MarkSeen />)).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <MarkSeen />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/messages",
                "params": Object {
                  "sender_action": "mark_seen",
                },
                "type": "message",
              },
            },
          ]
        `);
});
