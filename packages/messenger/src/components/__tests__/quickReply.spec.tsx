import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TextReply, PhoneReply, EmailReply } from '../quickReply';
import { renderPartElement } from './utils';

it.each([TextReply, PhoneReply, EmailReply])(
  '%p is valid Component',
  (Reply: any) => {
    expect(typeof Reply).toBe('function');
    expect(isNativeType(<Reply />)).toBe(true);
    expect(Reply.$$platform).toBe('messenger');
  }
);

test('TextReply match snpshot', async () => {
  expect(renderPartElement(<TextReply title="i want a pie" payload="🥧" />))
    .resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <TextReply
          payload="🥧"
          title="i want a pie"
        />,
        "path": "$#container",
        "type": "part",
        "value": Object {
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
    Array [
      Object {
        "node": <TextReply
          imageUrl="http://cake.it"
          payload="🍰"
          title="a piece of cake"
        />,
        "path": "$#container",
        "type": "part",
        "value": Object {
          "content_type": "text",
          "image_url": "http://cake.it",
          "payload": "🍰",
          "title": "a piece of cake",
        },
      },
    ]
  `);
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

test('EmailReply match snpshot', async () => {
  expect(renderPartElement(<EmailReply />)).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <EmailReply />,
        "path": "$#container",
        "type": "part",
        "value": Object {
          "content_type": "user_email",
        },
      },
    ]
  `);
});
