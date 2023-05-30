import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PhoneReply } from '../PhoneReply.js';
import { renderPartElement } from './utils.js';

it('is valid Component', () => {
  expect(typeof PhoneReply).toBe('function');
  expect(isNativeType(<PhoneReply />)).toBe(true);
  expect(PhoneReply.$$platform).toBe('facebook');
});

test('PhoneReply match snpshot', async () => {
  expect(renderPartElement(<PhoneReply />)).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PhoneReply />,
        "path": "$#container",
        "type": "part",
        "value": {
          "content_type": "user_phone_number",
        },
      },
    ]
  `);
});
