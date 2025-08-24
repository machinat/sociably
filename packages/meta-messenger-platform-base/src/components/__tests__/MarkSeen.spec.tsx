import Sociably from '@sociably/core';
import { MarkSeen as _MarkSeen } from '../MarkSeen.js';
import { renderUnitElement, makeTestComponent } from './utils.js';

const MarkSeen = makeTestComponent(_MarkSeen);

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
