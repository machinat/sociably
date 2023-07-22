import Sociably from '@sociably/core';
import { renderPartElement, makeTestComponent } from './utils.js';
import { PostbackButton as _PostbackButton } from '../PostbackButton.js';

const PostbackButton = makeTestComponent(_PostbackButton);

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <PostbackButton title="my button" payload="_MY_PAYLOAD_" />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PostbackButton
          payload="_MY_PAYLOAD_"
          title="my button"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "payload": "_MY_PAYLOAD_",
          "title": "my button",
          "type": "postback",
        },
      },
    ]
  `);
});
