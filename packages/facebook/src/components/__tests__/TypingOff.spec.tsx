import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TypingOff } from '../TypingOff.js';
import { renderUnitElement } from './utils.js';

it('is valid unit Component', () => {
  expect(typeof TypingOff).toBe('function');
  expect(isNativeType(<TypingOff />)).toBe(true);
  expect(TypingOff.$$platform).toBe('facebook');
});

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
