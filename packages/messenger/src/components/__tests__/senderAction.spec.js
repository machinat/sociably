import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';

import Renderer from '@machinat/core/renderer';
import { MarkSeen, TypingOn, TypingOff } from '../senderAction';

const renderer = new Renderer('messenger', () => null);

describe.each([MarkSeen, TypingOn, TypingOff])('%p', (Action) => {
  it('is valid unit Component', () => {
    expect(typeof Action).toBe('function');
    expect(isNativeType(<Action />)).toBe(true);
    expect(Action.$$platform).toBe('messenger');
  });
});

it('MarkSeen match snapshot', async () => {
  await expect(renderer.render(<MarkSeen />)).resolves.toMatchInlineSnapshot(`
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
  await expect(renderer.render(<TypingOn />)).resolves.toMatchInlineSnapshot(`
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
  await expect(renderer.render(<TypingOff />)).resolves.toMatchInlineSnapshot(`
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
