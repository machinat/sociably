import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { PhoneReply } from '../PhoneReply';
import { renderPartElement } from './utils';

it('is valid Component', () => {
  expect(typeof PhoneReply).toBe('function');
  expect(isNativeType(<PhoneReply />)).toBe(true);
  expect(PhoneReply.$$platform).toBe('facebook');
});

test('PhoneReply match snpshot', async () => {
  expect(renderPartElement(<PhoneReply />)).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <PhoneReply />,
        "path": "$#container",
        "type": "part",
        "value": Object {
          "content_type": "user_phone_number",
        },
      },
    ]
  `);
});
