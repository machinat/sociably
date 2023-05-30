import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { QuickReply } from '../QuickReply.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof QuickReply).toBe('function');
  expect(isNativeType(<QuickReply label="Hi" />)).toBe(true);
  expect(QuickReply.$$platform).toBe('twitter');
});

test('rendering', async () => {
  await expect(renderPartElement(<QuickReply label="Hi" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <QuickReply
          label="Hi"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
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
    [
      {
        "node": <QuickReply
          description="I'm friendly"
          label="Hi"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
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
    [
      {
        "node": <QuickReply
          description="I'm a friend"
          label="Hi"
          metadata="friendly handshake"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
          "description": "I'm a friend",
          "label": "Hi",
          "metadata": "friendly handshake",
        },
      },
    ]
  `);
});
