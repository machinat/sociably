import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ReplyButton } from '../ReplyButton.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof ReplyButton).toBe('function');
  expect(isNativeType(<ReplyButton id="" title="" />)).toBe(true);
  expect(ReplyButton.$$platform).toBe('whatsapp');
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
          "id": "0",
          "title": "FOO",
          "type": "reply",
        },
      },
    ]
  `);
});
