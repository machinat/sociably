import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeElement } from '@machinat/core/utils/isX';

import {
  URLButton,
  PostbackButton,
  BuyButton,
  CallButton,
  LoginButton,
  LogoutButton,
  GamePlayButton,
} from '../button';

const render = async (node) => {
  let rendered;
  const renderer = new Renderer('messenger', async (_, __, renderInner) => {
    rendered = await renderInner(node);
    return null;
  });

  await renderer.render(<container />);
  return rendered;
};

test.each([
  URLButton,
  PostbackButton,
  BuyButton,
  CallButton,
  LoginButton,
  LogoutButton,
  GamePlayButton,
])('is valid Component', (Button) => {
  expect(typeof Button).toBe('function');
  expect(isNativeElement(<Button />)).toBe(true);
  expect(Button.$$platform).toBe('messenger');
});

describe('URLButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(<URLButton title="my button" url="http://machinat.com" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <URLButton
                  title="my button"
                  url="http://machinat.com"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "fallback_url": undefined,
                  "messenger_extensions": undefined,
                  "title": "my button",
                  "type": "web_url",
                  "url": "http://machinat.com",
                  "webview_height_ratio": undefined,
                  "webview_share_button": undefined,
                },
              },
            ]
          `);

    await expect(
      render(
        <URLButton
          title="my button"
          url="http://machinat.com"
          heightRatio="compact"
          extensions
          fallbackURL="http://..."
          hideShareButton
        />
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <URLButton
                  extensions={true}
                  fallbackURL="http://..."
                  heightRatio="compact"
                  hideShareButton={true}
                  title="my button"
                  url="http://machinat.com"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "fallback_url": "http://...",
                  "messenger_extensions": true,
                  "title": "my button",
                  "type": "web_url",
                  "url": "http://machinat.com",
                  "webview_height_ratio": "compact",
                  "webview_share_button": "hide",
                },
              },
            ]
          `);
  });
});

describe('PostbackButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(<PostbackButton title="my button" payload="_MY_PAYLOAD_" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <PostbackButton
                  payload="_MY_PAYLOAD_"
                  title="my button"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "payload": "_MY_PAYLOAD_",
                  "title": "my button",
                  "type": "postback",
                },
              },
            ]
          `);
  });
});

describe('BuyButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(
        <BuyButton
          title="my button"
          payload="_MY_PAYLOAD_"
          currency="USD"
          isTest
          paymentType="FIXED_AMOUNT"
          merchantName="My Fake Business"
          requestedInfo={[
            'shipping_address',
            'contact_name',
            'contact_phone',
            'contact_email',
          ]}
          priceList={[
            {
              label: 'subtotal',
              amount: '12.75',
            },
          ]}
        />
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <BuyButton
                  currency="USD"
                  isTest={true}
                  merchantName="My Fake Business"
                  payload="_MY_PAYLOAD_"
                  paymentType="FIXED_AMOUNT"
                  priceList={
                    Array [
                      Object {
                        "amount": "12.75",
                        "label": "subtotal",
                      },
                    ]
                  }
                  requestedInfo={
                    Array [
                      "shipping_address",
                      "contact_name",
                      "contact_phone",
                      "contact_email",
                    ]
                  }
                  title="my button"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "payload": "_MY_PAYLOAD_",
                  "payment_summary": Object {
                    "currency": "USD",
                    "is_test_payment": true,
                    "merchant_name": "My Fake Business",
                    "payment_type": "FIXED_AMOUNT",
                    "price_list": Array [
                      Object {
                        "amount": "12.75",
                        "label": "subtotal",
                      },
                    ],
                    "requested_user_info": Array [
                      "shipping_address",
                      "contact_name",
                      "contact_phone",
                      "contact_email",
                    ],
                  },
                  "title": "my button",
                  "type": "payment",
                },
              },
            ]
          `);
  });
});

describe('CallButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(<CallButton title="call me maybe" number="+15105551234" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <CallButton
                  number="+15105551234"
                  title="call me maybe"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "number": "+15105551234",
                  "title": "call me maybe",
                  "type": "phone_number",
                },
              },
            ]
          `);
  });
});

describe('LoginButton', () => {
  it('match snapshot', async () => {
    await expect(render(<LoginButton url="https://council.elrond" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <LoginButton
                  url="https://council.elrond"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "type": "account_link",
                  "url": "https://council.elrond",
                },
              },
            ]
          `);
  });
});

describe('LoginButton', () => {
  it('match snapshot', async () => {
    await expect(render(<LoginButton url="https://council.elrond" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <LoginButton
                  url="https://council.elrond"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "type": "account_link",
                  "url": "https://council.elrond",
                },
              },
            ]
          `);
  });
});

describe('LogoutButton', () => {
  it('match snapshot', async () => {
    await expect(render(<LogoutButton />)).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <LogoutButton />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "type": "account_unlink",
                },
              },
            ]
          `);
  });
});

describe('GamePlayButton', () => {
  it('match snapshot', async () => {
    await expect(
      render(
        <GamePlayButton
          title="I want to play a game"
          payload="GAME_OVER"
          playerId="Adam"
          contextId="SAW"
        />
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <GamePlayButton
                  contextId="SAW"
                  payload="GAME_OVER"
                  playerId="Adam"
                  title="I want to play a game"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "game_metadata": Object {
                    "context_id": "SAW",
                    "player_id": "Adam",
                  },
                  "payload": "GAME_OVER",
                  "title": "I want to play a game",
                  "type": "game_play",
                },
              },
            ]
          `);
  });
});
