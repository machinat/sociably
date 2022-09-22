import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TypingOn } from '../TypingOn';
import { renderUnitElement } from './utils';

it('is valid unit Component', () => {
  expect(typeof TypingOn).toBe('function');
  expect(isNativeType(<TypingOn />)).toBe(true);
  expect(TypingOn.$$platform).toBe('facebook');
});

it('TypingOn match snapshot', async () => {
  await expect(renderUnitElement(<TypingOn />)).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <TypingOn />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "apiPath": "me/messages",
                "params": Object {
                  "sender_action": "typing_on",
                },
                "type": "message",
              },
            },
          ]
        `);
});
