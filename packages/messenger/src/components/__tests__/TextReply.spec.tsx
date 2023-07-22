import Sociably from '@sociably/core';
import { TextReply as _TextReply } from '../TextReply.js';
import { renderPartElement, makeTestComponent } from './utils.js';

const TextReply = makeTestComponent(_TextReply);

it('match snpshot', async () => {
  expect(renderPartElement(<TextReply title="i want a pie" payload="🥧" />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <TextReply
          payload="🥧"
          title="i want a pie"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "content_type": "text",
          "image_url": undefined,
          "payload": "🥧",
          "title": "i want a pie",
        },
      },
    ]
  `);
  expect(
    renderPartElement(
      <TextReply
        title="a piece of cake"
        payload="🍰"
        imageUrl="http://cake.it"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <TextReply
          imageUrl="http://cake.it"
          payload="🍰"
          title="a piece of cake"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
          "content_type": "text",
          "image_url": "http://cake.it",
          "payload": "🍰",
          "title": "a piece of cake",
        },
      },
    ]
  `);
});
