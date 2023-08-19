import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { QuickReply } from '../QuickReply.js';
import { UriAction } from '../Action.js';
import { renderPartElement } from './utils.js';

it('is valid native component', () => {
  expect(isNativeType(<QuickReply>{null}</QuickReply>)).toBe(true);
  expect(QuickReply.$$platform).toBe('line');
  expect(QuickReply.$$name).toBe('QuickReply');
});

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <QuickReply imageUrl="https://...">
        <UriAction uri="https://..." label="foo" />
      </QuickReply>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <QuickReply
          imageUrl="https://..."
        >
          <UriAction
            label="foo"
            uri="https://..."
          />
        </QuickReply>,
        "path": "$#container",
        "type": "part",
        "value": {
          "action": {
            "label": "foo",
            "type": "uri",
            "uri": "https://...",
          },
          "imageUrl": "https://...",
          "type": "action",
        },
      },
    ]
  `);
});
