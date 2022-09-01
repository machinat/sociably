import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { QuickReply } from '../QuickReply';
import { UriAction } from '../Action';
import { renderPartElement } from './utils';

it('is valid native component', () => {
  expect(typeof QuickReply).toBe('function');

  expect(isNativeType(<QuickReply>{null}</QuickReply>)).toBe(true);
  expect(QuickReply.$$platform).toBe('line');
});

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <QuickReply imageUrl="https://...">
        <UriAction uri="https://..." label="foo" />
      </QuickReply>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "action": Object {
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
