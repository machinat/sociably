import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { QuickReply } from '../QuickReply';
import { renderPartElement } from './utils';

it('is a valid Component', () => {
  expect(typeof QuickReply).toBe('function');
  expect(isNativeType(<QuickReply label="Hi" />)).toBe(true);
  expect(QuickReply.$$platform).toBe('twitter');
});

test('rendering', async () => {
  await expect(renderPartElement(<QuickReply label="Hi" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <QuickReply
                label="Hi"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "description": undefined,
                "label": "Hi",
                "metadata": undefined,
              },
            },
          ]
        `);

  await expect(
    renderPartElement(<QuickReply label="Hi" description="I'm friendly" />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <QuickReply
                description="I'm friendly"
                label="Hi"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "description": "I'm friendly",
                "label": "Hi",
                "metadata": undefined,
              },
            },
          ]
        `);

  await expect(
    renderPartElement(
      <QuickReply
        label="Hi"
        description="I'm a friend"
        metadata="friendly handshake"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <QuickReply
                description="I'm a friend"
                label="Hi"
                metadata="friendly handshake"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "description": "I'm a friend",
                "label": "Hi",
                "metadata": "friendly handshake",
              },
            },
          ]
        `);
});
