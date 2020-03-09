import moxy from 'moxy';
import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import {
  URLButton,
  PostbackButton,
  ShareButton,
  BuyButton,
  CallButton,
  LoginButton,
  LogoutButton,
  GamePlayButton,
} from '../button';
import { GenericTemplate, GenericItem } from '../template';

const renderInner = moxy(() => null);
const renderHelper = element => element.type(element, renderInner, '$');

test.each([
  URLButton,
  PostbackButton,
  ShareButton,
  BuyButton,
  CallButton,
  LoginButton,
  LogoutButton,
  GamePlayButton,
])('is valid Component', Button => {
  expect(typeof Button).toBe('function');
  expect(isNativeElement(<Button />)).toBe(true);
  expect(Button.$$platform).toBe('messenger');
});

describe('URLButton', () => {
  it('match snapshot', async () => {
    await expect(
      renderHelper(<URLButton title="my button" url="http://machinat.com" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <URLButton
                  title="my button"
                  url="http://machinat.com"
                />,
                "path": "$",
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
      renderHelper(
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
                "path": "$",
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
      renderHelper(<PostbackButton title="my button" payload="_MY_PAYLOAD_" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <PostbackButton
                  payload="_MY_PAYLOAD_"
                  title="my button"
                />,
                "path": "$",
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

describe('ShareButton', () => {
  it('match snapshot', async () => {
    await expect(renderHelper(<ShareButton />)).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <ShareButton />,
                "path": "$",
                "type": "part",
                "value": Object {
                  "share_contents": undefined,
                  "type": "element_share",
                },
              },
            ]
          `);
  });

  it('match snapshot with customized template to share specified', async () => {
    const sharedTemplate = (
      <GenericTemplate>
        <GenericItem title="foo" subtitle="bar" />
      </GenericTemplate>
    );
    renderInner.mock.fake(async () => [
      {
        type: 'unit',
        value: { message: '__RENDERED_GENERIC_TEMPLATE_MEASSGE_OBJ__' },
        node: sharedTemplate,
      },
    ]);
    await expect(renderHelper(<ShareButton>{sharedTemplate}</ShareButton>))
      .resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <ShareButton>
                  <GenericTemplate>
                    <GenericItem
                      subtitle="bar"
                      title="foo"
                    />
                  </GenericTemplate>
                </ShareButton>,
                "path": "$",
                "type": "part",
                "value": Object {
                  "share_contents": "__RENDERED_GENERIC_TEMPLATE_MEASSGE_OBJ__",
                  "type": "element_share",
                },
              },
            ]
          `);

    expect(renderInner.mock).toHaveBeenCalledWith(sharedTemplate, '.children');
  });

  it('throw if non GenericTemplate children given', async () => {
    const Invalid = () => {};
    renderInner.mock.fake(async node => [
      {
        type: 'unit',
        value: '__SOMETHING_WRONG__',
        node,
        path: '$:0#ShareButton.children:0',
      },
    ]);

    await expect(
      renderHelper(
        <ShareButton>
          <Invalid />
        </ShareButton>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"<Invalid /> at $:0#ShareButton.children:0 is invalid, only <[GenericTemplate]/> allowed"`
    );
  });
});

describe('BuyButton', () => {
  it('match snapshot', async () => {
    await expect(
      renderHelper(
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
                "path": "$",
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
      renderHelper(<CallButton title="call me maybe" number="+15105551234" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <CallButton
                  number="+15105551234"
                  title="call me maybe"
                />,
                "path": "$",
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
    await expect(renderHelper(<LoginButton url="https://council.elrond" />))
      .resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <LoginButton
                  url="https://council.elrond"
                />,
                "path": "$",
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
    await expect(renderHelper(<LoginButton url="https://council.elrond" />))
      .resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <LoginButton
                  url="https://council.elrond"
                />,
                "path": "$",
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
    await expect(renderHelper(<LogoutButton />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <LogoutButton />,
                "path": "$",
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
      renderHelper(
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
                "path": "$",
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
