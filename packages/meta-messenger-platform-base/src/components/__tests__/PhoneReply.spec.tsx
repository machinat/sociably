import Sociably from '@sociably/core';
import { PhoneReply as _PhoneReply } from '../PhoneReply.js';
import { renderPartElement, makeTestComponent } from './utils.js';

const PhoneReply = makeTestComponent(_PhoneReply);

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
