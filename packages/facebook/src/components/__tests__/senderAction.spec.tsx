import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { MarkSeen, TypingOn, TypingOff } from '../senderAction';
import { renderUnitElement } from './utils';

describe.each([MarkSeen, TypingOn, TypingOff])('%p', (Action) => {
  it('is valid unit Component', () => {
    expect(typeof Action).toBe('function');
    expect(isNativeType(<Action />)).toBe(true);
    expect(Action.$$platform).toBe('facebook');
  });
});

it('MarkSeen match snapshot', async () => {
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
