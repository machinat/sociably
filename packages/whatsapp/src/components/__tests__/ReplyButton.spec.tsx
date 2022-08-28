import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ReplyButton } from '../ReplyButton';
import { renderPartElement } from './utils';

it('is a valid Component', () => {
  expect(typeof ReplyButton).toBe('function');
  expect(isNativeType(<ReplyButton id="" title="" />)).toBe(true);
  expect(ReplyButton.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(renderPartElement(<ReplyButton id="0" title="FOO" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ReplyButton
                id="0"
                title="FOO"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "id": "0",
                "title": "FOO",
                "type": "reply",
              },
            },
          ]
        `);
});
