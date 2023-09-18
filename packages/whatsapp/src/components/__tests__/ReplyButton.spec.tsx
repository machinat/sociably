import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ReplyButton } from '../ReplyButton.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<ReplyButton data="" title="" />)).toBe(true);
  expect(ReplyButton.$$platform).toBe('whatsapp');
  expect(ReplyButton.$$name).toBe('ReplyButton');
});

test('rendering value', async () => {
  await expect(renderPartElement(<ReplyButton data="foo" title="FOO" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ReplyButton
          data="foo"
          title="FOO"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "reply": {
            "id": "foo",
            "title": "FOO",
          },
          "type": "reply",
        },
      },
    ]
  `);
});
