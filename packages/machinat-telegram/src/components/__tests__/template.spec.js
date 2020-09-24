import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import { InlineKeyboard, CallbackButton } from '../replyMarkup';
import { Text, Contact, Poll, Dice, Invoice, Game } from '../template';

const renderer = new Renderer('telegram', (node, path) => [
  {
    type: 'text',
    node,
    path,
    value: `<${node.type}>${node.props.children}</${node.type}>`,
  },
]);

describe.each([Text, Contact, Poll, Dice, Invoice, Game])('%p', (Template) => {
  it('is valid unit Component', () => {
    expect(typeof Template).toBe('function');
    expect(isNativeType(<Template />)).toBe(true);
    expect(Template.$$platform).toBe('telegram');
  });
});

test('Text match snapshot', async () => {
  await expect(
    renderer.render(
      <Text>
        <b>Hello</b>
        <i>World!</i>
      </Text>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Text>
                <b>
                  Hello
                </b>
                <i>
                  World!
                </i>
              </Text>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendMessage",
                "parameters": Object {
                  "disable_notification": undefined,
                  "disable_web_page_preview": undefined,
                  "parse_mode": "HTML",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "text": "<b>Hello</b><i>World!</i>",
                },
              },
            },
          ]
        `);
  await expect(renderer.render(<Text parseMode="None">Hello World!</Text>))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Text
                parseMode="None"
              >
                Hello World!
              </Text>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendMessage",
                "parameters": Object {
                  "disable_notification": undefined,
                  "disable_web_page_preview": undefined,
                  "parse_mode": undefined,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "text": "Hello World!",
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Text
        parseMode="MarkdownV2"
        disableWebPagePreview
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Hello" data="__HELLO__" />
          </InlineKeyboard>
        }
      >
        *Hello* _World!_
      </Text>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Text
                disableNotification={true}
                disableWebPagePreview={true}
                parseMode="MarkdownV2"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__HELLO__"
                      text="Hello"
                    />
                  </InlineKeyboard>
                }
                replyToMessageId={123}
              >
                *Hello* _World!_
              </Text>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendMessage",
                "parameters": Object {
                  "disable_notification": true,
                  "disable_web_page_preview": true,
                  "parse_mode": "MarkdownV2",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__HELLO__",
                        "text": "Hello",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "text": "*Hello* _World!_",
                },
              },
            },
          ]
        `);
});

test('Contact match snapshot', async () => {
  await expect(
    renderer.render(<Contact phoneNumber="+123456789" firstName="John" />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Contact
                firstName="John"
                phoneNumber="+123456789"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendContact",
                "parameters": Object {
                  "disable_notification": undefined,
                  "first_name": "John",
                  "last_name": undefined,
                  "phone_number": "+123456789",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "vcard": undefined,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Contact
        phoneNumber="+123456789"
        firstName="John"
        lastName="Doe"
        vcard="Love Dog"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Hello" data="__HELLO__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Contact
                disableNotification={true}
                firstName="John"
                lastName="Doe"
                phoneNumber="+123456789"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__HELLO__"
                      text="Hello"
                    />
                  </InlineKeyboard>
                }
                replyToMessageId={123}
                vcard="Love Dog"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendContact",
                "parameters": Object {
                  "disable_notification": true,
                  "first_name": "John",
                  "last_name": "Doe",
                  "phone_number": "+123456789",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__HELLO__",
                        "text": "Hello",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "vcard": "Love Dog",
                },
              },
            },
          ]
        `);
});

test('Poll match snapshot', async () => {
  await expect(
    renderer.render(
      <Poll
        question="Cat or Dog?"
        options={['😼', '🐶', '🦊']}
        openPeriod={599}
        explanationParseMode="None"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Poll
                explanationParseMode="None"
                openPeriod={599}
                options={
                  Array [
                    "😼",
                    "🐶",
                    "🦊",
                  ]
                }
                question="Cat or Dog?"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendPoll",
                "parameters": Object {
                  "allows_multiple_answers": undefined,
                  "close_date": undefined,
                  "correct_option_id": undefined,
                  "disable_notification": undefined,
                  "explanation": undefined,
                  "explanation_parse_mode": undefined,
                  "is_anonymous": undefined,
                  "is_closed": undefined,
                  "open_period": 599,
                  "options": Array [
                    "😼",
                    "🐶",
                    "🦊",
                  ],
                  "question": "Cat or Dog?",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "type": undefined,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Poll
        question="Rabbit or Turtle?"
        options={['🐇', '🐢', '🐊']}
        closeDate={160078593}
        type="quiz"
        correctOptionId={2}
        explanation={<b>YAMMY!</b>}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Poll
                closeDate={160078593}
                correctOptionId={2}
                explanation={
                  <b>
                    YAMMY!
                  </b>
                }
                options={
                  Array [
                    "🐇",
                    "🐢",
                    "🐊",
                  ]
                }
                question="Rabbit or Turtle?"
                type="quiz"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendPoll",
                "parameters": Object {
                  "allows_multiple_answers": undefined,
                  "close_date": 160078593,
                  "correct_option_id": 2,
                  "disable_notification": undefined,
                  "explanation": "<b>YAMMY!</b>",
                  "explanation_parse_mode": "HTML",
                  "is_anonymous": undefined,
                  "is_closed": undefined,
                  "open_period": undefined,
                  "options": Array [
                    "🐇",
                    "🐢",
                    "🐊",
                  ],
                  "question": "Rabbit or Turtle?",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "type": "quiz",
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Poll
        question="Pizza or HotDog?"
        options={['🍕', '🌭', '🐶']}
        isAnonymous
        type="quiz"
        allowsMultipleAnswers
        correctOptionId={2}
        explanation="*Woof!*"
        explanationParseMode="MarkdownV2"
        closeDate={new Date(160078593000)}
        isClosed
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Woof" data="__WOOF__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Poll
                allowsMultipleAnswers={true}
                closeDate={1975-01-27T18:16:33.000Z}
                correctOptionId={2}
                disableNotification={true}
                explanation="*Woof!*"
                explanationParseMode="MarkdownV2"
                isAnonymous={true}
                isClosed={true}
                options={
                  Array [
                    "🍕",
                    "🌭",
                    "🐶",
                  ]
                }
                question="Pizza or HotDog?"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__WOOF__"
                      text="Woof"
                    />
                  </InlineKeyboard>
                }
                replyToMessageId={123}
                type="quiz"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendPoll",
                "parameters": Object {
                  "allows_multiple_answers": true,
                  "close_date": 160078593,
                  "correct_option_id": 2,
                  "disable_notification": true,
                  "explanation": "*Woof!*",
                  "explanation_parse_mode": "MarkdownV2",
                  "is_anonymous": true,
                  "is_closed": true,
                  "open_period": undefined,
                  "options": Array [
                    "🍕",
                    "🌭",
                    "🐶",
                  ],
                  "question": "Pizza or HotDog?",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__WOOF__",
                        "text": "Woof",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "type": "quiz",
                },
              },
            },
          ]
        `);
});

test('Dice match snapshot', async () => {
  await expect(renderer.render(<Dice />)).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Dice />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendDice",
                "parameters": Object {
                  "disable_notification": undefined,
                  "emoji": undefined,
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Dice
        emoji="🎯"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Again" data="__AGAIN__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Dice
                disableNotification={true}
                emoji="🎯"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__AGAIN__"
                      text="Again"
                    />
                  </InlineKeyboard>
                }
                replyToMessageId={123}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendDice",
                "parameters": Object {
                  "disable_notification": true,
                  "emoji": "🎯",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__AGAIN__",
                        "text": "Again",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                },
              },
            },
          ]
        `);
});

test('Invoice match snapshot', async () => {
  await expect(
    renderer.render(
      <Invoice
        title="You bill"
        description="You will pay for this!"
        payload="Please!"
        providerToken="xxx"
        startParameter="your_bill_today"
        currency="USD"
        prices={[
          { label: '🍕', amount: 10 },
          { label: '🌭', amount: 10 },
        ]}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Invoice
                currency="USD"
                description="You will pay for this!"
                payload="Please!"
                prices={
                  Array [
                    Object {
                      "amount": 10,
                      "label": "🍕",
                    },
                    Object {
                      "amount": 10,
                      "label": "🌭",
                    },
                  ]
                }
                providerToken="xxx"
                startParameter="your_bill_today"
                title="You bill"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendInvoice",
                "parameters": Object {
                  "currency": "USD",
                  "description": "You will pay for this!",
                  "disable_notification": undefined,
                  "is_flexible": undefined,
                  "need_email": undefined,
                  "need_name": undefined,
                  "need_phone_number": undefined,
                  "need_shipping_address": undefined,
                  "payload": "Please!",
                  "photo_height": undefined,
                  "photo_size": undefined,
                  "photo_url": undefined,
                  "photo_width": undefined,
                  "prices": Array [
                    Object {
                      "amount": 10,
                      "label": "🍕",
                    },
                    Object {
                      "amount": 10,
                      "label": "🌭",
                    },
                  ],
                  "provider_data": undefined,
                  "provider_token": "xxx",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                  "send_email_to_provider": undefined,
                  "send_phone_number_to_provider": undefined,
                  "start_parameter": "your_bill_today",
                  "title": "You bill",
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Invoice
        title="🐶's bill"
        description="You will pay for this!"
        payload="Please!"
        providerToken="xxx"
        startParameter="his_bill_today"
        currency="USD"
        prices={[
          { label: '🍕', amount: 10 },
          { label: '🌭', amount: 10 },
        ]}
        providerData="foo"
        photoURL="http://..."
        photoSize={333}
        photoWidth={480}
        photoHeight={640}
        needName
        needPhoneNumber
        needEmail
        needShippingAddress
        sendPhoneNumberToProvider
        sendEmailToProvider
        isFlexible
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Cheaper?" data="__BARGAIN__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Invoice
                currency="USD"
                description="You will pay for this!"
                disableNotification={true}
                isFlexible={true}
                needEmail={true}
                needName={true}
                needPhoneNumber={true}
                needShippingAddress={true}
                payload="Please!"
                photoHeight={640}
                photoSize={333}
                photoURL="http://..."
                photoWidth={480}
                prices={
                  Array [
                    Object {
                      "amount": 10,
                      "label": "🍕",
                    },
                    Object {
                      "amount": 10,
                      "label": "🌭",
                    },
                  ]
                }
                providerData="foo"
                providerToken="xxx"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__BARGAIN__"
                      text="Cheaper?"
                    />
                  </InlineKeyboard>
                }
                replyToMessageId={123}
                sendEmailToProvider={true}
                sendPhoneNumberToProvider={true}
                startParameter="his_bill_today"
                title="🐶's bill"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendInvoice",
                "parameters": Object {
                  "currency": "USD",
                  "description": "You will pay for this!",
                  "disable_notification": true,
                  "is_flexible": true,
                  "need_email": true,
                  "need_name": true,
                  "need_phone_number": true,
                  "need_shipping_address": true,
                  "payload": "Please!",
                  "photo_height": 640,
                  "photo_size": 333,
                  "photo_url": "http://...",
                  "photo_width": 480,
                  "prices": Array [
                    Object {
                      "amount": 10,
                      "label": "🍕",
                    },
                    Object {
                      "amount": 10,
                      "label": "🌭",
                    },
                  ],
                  "provider_data": "foo",
                  "provider_token": "xxx",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__BARGAIN__",
                        "text": "Cheaper?",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                  "send_email_to_provider": true,
                  "send_phone_number_to_provider": true,
                  "start_parameter": "his_bill_today",
                  "title": "🐶's bill",
                },
              },
            },
          ]
        `);
});

test('Game match snapshot', async () => {
  await expect(renderer.render(<Game gameShortName="Saw" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Game
                gameShortName="Saw"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendGame",
                "parameters": Object {
                  "disable_notification": undefined,
                  "game_short_name": "Saw",
                  "reply_markup": undefined,
                  "reply_to_message_id": undefined,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <Game
        gameShortName="Saw"
        disableNotification
        replyToMessageId={123}
        replyMarkup={
          <InlineKeyboard>
            <CallbackButton text="Next time?" data="__ESCAPE__" />
          </InlineKeyboard>
        }
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Game
                disableNotification={true}
                gameShortName="Saw"
                replyMarkup={
                  <InlineKeyboard>
                    <CallbackButton
                      data="__ESCAPE__"
                      text="Next time?"
                    />
                  </InlineKeyboard>
                }
                replyToMessageId={123}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendGame",
                "parameters": Object {
                  "disable_notification": true,
                  "game_short_name": "Saw",
                  "reply_markup": Object {
                    "inline_keyboard": Array [
                      Object {
                        "callback_data": "__ESCAPE__",
                        "text": "Next time?",
                      },
                    ],
                  },
                  "reply_to_message_id": 123,
                },
              },
            },
          ]
        `);
});
