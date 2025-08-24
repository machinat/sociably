import Sociably from '@sociably/core';
import { TypingOff as _TypingOff } from '../TypingOff.js';
import { renderUnitElement, makeTestComponent } from './utils.js';

const TypingOff = makeTestComponent(_TypingOff);

it('TypingOff match snapshot', async () => {
  await expect(renderUnitElement(<TypingOff />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <TypingOff />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "sender_action": "typing_off",
          },
          "type": "message",
        },
      },
    ]
  `);
});
