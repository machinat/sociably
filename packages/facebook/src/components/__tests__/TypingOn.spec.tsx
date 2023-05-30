import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TypingOn } from '../TypingOn.js';
import { renderUnitElement } from './utils.js';

it('is valid unit Component', () => {
  expect(typeof TypingOn).toBe('function');
  expect(isNativeType(<TypingOn />)).toBe(true);
  expect(TypingOn.$$platform).toBe('facebook');
});

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
