import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ReplyButton } from '../ReplyButton.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<ReplyButton id="" title="" />)).toBe(true);
  expect(ReplyButton.$$platform).toBe('whatsapp');
  expect(ReplyButton.$$name).toBe('ReplyButton');
});

test('rendering value', async () => {
  await expect(renderPartElement(<ReplyButton id="0" title="FOO" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <ReplyButton
          id="0"
          title="FOO"
        />,
        "path": "$#p",
        "type": "part",
        "value": {
          "reply": {
            "id": "0",
            "title": "FOO",
          },
          "type": "reply",
        },
      },
    ]
  `);
});
