import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import {
  QuickReply,
  PhoneQuickReply,
  EmailQuickReply,
  LocationQuickReply,
} from '../quickReply';

const renderHelper = element => element.type(element, null, '$');

it.each([QuickReply, PhoneQuickReply, EmailQuickReply, LocationQuickReply])(
  '%p is valid Component',
  Reply => {
    expect(typeof Reply).toBe('function');
    expect(isNativeElement(<Reply />)).toBe(true);
    expect(Reply.$$platform).toBe('messenger');
  }
);

test('QuickReply match snpshot', async () => {
  expect(renderHelper(<QuickReply title="i want a pie" payload="🥧" />))
    .resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <QuickReply
          payload="🥧"
          title="i want a pie"
        />,
        "path": "$",
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
    renderHelper(
      <QuickReply
        title="a piece of cake"
        payload="🍰"
        imageURL="http://cake.it"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <QuickReply
          imageURL="http://cake.it"
          payload="🍰"
          title="a piece of cake"
        />,
        "path": "$",
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

test('PhoneQuickReply match snpshot', async () => {
  expect(renderHelper(<PhoneQuickReply />)).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <PhoneQuickReply />,
        "path": "$",
        "type": "part",
        "value": Object {
          "content_type": "user_phone_number",
        },
      },
    ]
  `);
});

test('EmailQuickReply match snpshot', async () => {
  expect(renderHelper(<EmailQuickReply />)).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <EmailQuickReply />,
        "path": "$",
        "type": "part",
        "value": Object {
          "content_type": "user_email",
        },
      },
    ]
  `);
});

test('LocationQuickReply match snpshot', async () => {
  expect(renderHelper(<LocationQuickReply />)).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <LocationQuickReply />,
        "path": "$",
        "type": "part",
        "value": Object {
          "content_type": "location",
        },
      },
    ]
  `);
});
