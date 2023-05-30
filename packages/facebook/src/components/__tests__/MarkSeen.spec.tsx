import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MarkSeen } from '../MarkSeen.js';
import { renderUnitElement } from './utils.js';

it('is valid unit Component', () => {
  expect(typeof MarkSeen).toBe('function');
  expect(isNativeType(<MarkSeen />)).toBe(true);
  expect(MarkSeen.$$platform).toBe('facebook');
});

it('match snapshot', async () => {
  await expect(renderUnitElement(<MarkSeen />)).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <MarkSeen />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "sender_action": "mark_seen",
          },
          "type": "message",
        },
      },
    ]
  `);
});
