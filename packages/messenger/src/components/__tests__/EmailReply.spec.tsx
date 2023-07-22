import Sociably from '@sociably/core';
import { EmailReply as _EmailReply } from '../EmailReply.js';
import { renderPartElement, makeTestComponent } from './utils.js';

const EmailReply = makeTestComponent(_EmailReply);

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
