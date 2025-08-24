import Sociably from '@sociably/core';
import { TypingOn as _TypingOn } from '../TypingOn.js';
import { renderUnitElement, makeTestComponent } from './utils.js';

const TypingOn = makeTestComponent(_TypingOn);

it('TypingOn match snapshot', async () => {
  await expect(renderUnitElement(<TypingOn />)).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <TypingOn />,
        "path": "$",
        "type": "unit",
        "value": {
          "apiPath": "me/messages",
          "params": {
            "sender_action": "typing_on",
          },
          "type": "message",
        },
      },
    ]
  `);
});
