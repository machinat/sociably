import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import { MarkSeen, TypingOn, TypingOff } from '../senderAction';

const renderHelper = element => element.type(element, null, '$');

describe.each([MarkSeen, TypingOn, TypingOff])('%p', Action => {
  it('is valid unit Component', () => {
    expect(typeof Action).toBe('function');
    expect(isNativeElement(<Action />)).toBe(true);
    expect(Action.$$platform).toBe('messenger');
  });
});

it('MarkSeen match snapshot', async () => {
  await expect(renderHelper(<MarkSeen />)).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <MarkSeen />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "sender_action": "mark_seen",
              },
            },
          ]
        `);
});

it('TypingOn match snapshot', async () => {
  await expect(renderHelper(<TypingOn />)).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <TypingOn />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "sender_action": "typing_on",
              },
            },
          ]
        `);
});

it('TypingOff match snapshot', async () => {
  await expect(renderHelper(<TypingOff />)).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <TypingOff />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "sender_action": "typing_off",
              },
            },
          ]
        `);
});
