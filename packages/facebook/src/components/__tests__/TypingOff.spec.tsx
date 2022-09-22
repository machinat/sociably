import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TypingOff } from '../TypingOff';
import { renderUnitElement } from './utils';

it('is valid unit Component', () => {
  expect(typeof TypingOff).toBe('function');
  expect(isNativeType(<TypingOff />)).toBe(true);
  expect(TypingOff.$$platform).toBe('facebook');
});

it('TypingOff match snapshot', async () => {
  await expect(renderUnitElement(<TypingOff />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <TypingOff />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/messages",
                "params": Object {
                  "sender_action": "typing_off",
                },
                "type": "message",
              },
            },
          ]
        `);
});
