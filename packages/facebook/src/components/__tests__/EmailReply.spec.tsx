import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { EmailReply } from '../EmailReply.js';
import { renderPartElement } from './utils.js';

it('is valid Component', () => {
  expect(typeof EmailReply).toBe('function');
  expect(isNativeType(<EmailReply />)).toBe(true);
  expect(EmailReply.$$platform).toBe('facebook');
});

test('EmailReply match snpshot', async () => {
  expect(renderPartElement(<EmailReply />)).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <EmailReply />,
        "path": "$#container",
        "type": "part",
        "value": {
          "content_type": "user_email",
        },
      },
    ]
  `);
});
