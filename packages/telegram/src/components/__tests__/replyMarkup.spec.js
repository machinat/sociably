import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeType } from '@machinat/core/utils/isX';

import {
  URLButton,
  CallbackButton,
  SwitchInlineQueryButton,
  CallbackGameButton,
  PayButton,
  InlineKeyboard,
  ReplyButton,
  KeyboardRow,
  ReplyKeyboard,
  RemoveReplyKeyboard,
  ForceReply,
} from '../replyMarkup';

const render = async (node) => {
  let rendered;
  const renderer = new Renderer('telegram', async (_, __, renderInner) => {
    rendered = await renderInner(node);
    return null;
  });

  await renderer.render(<container />);
  return rendered;
};

test.each([
  URLButton,
  CallbackButton,
  SwitchInlineQueryButton,
  CallbackGameButton,
  PayButton,
  InlineKeyboard,
  ReplyButton,
  KeyboardRow,
  ReplyKeyboard,
  RemoveReplyKeyboard,
  ForceReply,
])('is valid Component', (Component) => {
  expect(typeof Component).toBe('function');
  expect(isNativeType(<Component />)).toBe(true);
  expect(Component.$$platform).toBe('telegram');
});

describe('URLButton', () => {
  test('non login mode match snapshot', async () => {
    await expect(render(<URLButton text="Go" url="http://machinat.com" />))
      .resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <URLButton
                  text="Go"
                  url="http://machinat.com"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "text": "Go",
                  "url": "http://machinat.com",
                },
              },
            ]
          `);
  });

  test('login mode match snapshot', async () => {
    await expect(
      render(<URLButton login text="Go and Log in" url="http://machinat.com" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <URLButton
                  login={true}
                  text="Go and Log in"
                  url="http://machinat.com"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "login_url": Object {
                    "bot_username": undefined,
                    "forward_text": undefined,
                    "request_write_access": undefined,
                    "url": "http://machinat.com",
                  },
                  "text": "Go and Log in",
                },
              },
            ]
          `);

    await expect(
      render(
        <URLButton
          login
          text="Go and Log in"
          url="http://machinat.com"
          forwardText="Forwarded Login"
          botUserName="R2"
          requestWriteAccess
        />
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <URLButton
                  botUserName="R2"
                  forwardText="Forwarded Login"
                  login={true}
                  requestWriteAccess={true}
                  text="Go and Log in"
                  url="http://machinat.com"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "login_url": Object {
                    "bot_username": "R2",
                    "forward_text": "Forwarded Login",
                    "request_write_access": true,
                    "url": "http://machinat.com",
                  },
                  "text": "Go and Log in",
                },
              },
            ]
          `);
  });
});

describe('CallbackButton', () => {
  test('match snapshot', async () => {
    await expect(render(<CallbackButton text="Hello" data="World!" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <CallbackButton
                  data="World!"
                  text="Hello"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "callback_data": "World!",
                  "text": "Hello",
                },
              },
            ]
          `);
  });
});

describe('SwitchInlineQueryButton', () => {
  test('match snapshot', async () => {
    await expect(render(<SwitchInlineQueryButton text="Try" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <SwitchInlineQueryButton
                  text="Try"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "switch_inline_query": "",
                  "text": "Try",
                },
              },
            ]
          `);
    await expect(render(<SwitchInlineQueryButton text="Try" query="foo" />))
      .resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <SwitchInlineQueryButton
                  query="foo"
                  text="Try"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "switch_inline_query": "foo",
                  "text": "Try",
                },
              },
            ]
          `);
  });

  test('current chat mode match snapshot', async () => {
    await expect(render(<SwitchInlineQueryButton currentChat text="Try" />))
      .resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <SwitchInlineQueryButton
                  currentChat={true}
                  text="Try"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "switch_inline_query_current_chat": "",
                  "text": "Try",
                },
              },
            ]
          `);
    await expect(
      render(<SwitchInlineQueryButton currentChat text="Try" query="foo" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <SwitchInlineQueryButton
                  currentChat={true}
                  query="foo"
                  text="Try"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "switch_inline_query_current_chat": "foo",
                  "text": "Try",
                },
              },
            ]
          `);
  });
});

describe('CallbackGameButton', () => {
  test('match snapshot', async () => {
    await expect(render(<CallbackGameButton text="Play" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <CallbackGameButton
                  text="Play"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "callback_game": Object {},
                  "text": "Play",
                },
              },
            ]
          `);
  });
});

describe('PayButton', () => {
  test('match snapshot', async () => {
    await expect(render(<PayButton text="$$$" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <PayButton
                  text="$$$"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "pay": true,
                  "text": "$$$",
                },
              },
            ]
          `);
  });
});

describe('InlineKeyboard', () => {
  test('match snapshot', async () => {
    await expect(
      render(
        <InlineKeyboard>
          <URLButton text="Go" url="http://machinat.com" />

          <KeyboardRow>
            <CallbackButton text="Hello" data="World!" />
            <SwitchInlineQueryButton text="Try" />
          </KeyboardRow>
        </InlineKeyboard>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <InlineKeyboard>
                  <URLButton
                    text="Go"
                    url="http://machinat.com"
                  />
                  <KeyboardRow>
                    <CallbackButton
                      data="World!"
                      text="Hello"
                    />
                    <SwitchInlineQueryButton
                      text="Try"
                    />
                  </KeyboardRow>
                </InlineKeyboard>,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "inline_keyboard": Array [
                    Array [
                      Object {
                        "text": "Go",
                        "url": "http://machinat.com",
                      },
                    ],
                    Array [
                      Object {
                        "callback_data": "World!",
                        "text": "Hello",
                      },
                      Object {
                        "switch_inline_query": "",
                        "text": "Try",
                      },
                    ],
                  ],
                },
              },
            ]
          `);
  });
});

describe('ReplyKeyboard', () => {
  test('match snapshot', async () => {
    await expect(
      render(
        <ReplyKeyboard>
          <ReplyButton text="Button1" />

          <KeyboardRow>
            <ReplyButton text="Button2" requestContact />
            <ReplyButton text="Button3" requestLocation />
          </KeyboardRow>

          <KeyboardRow>
            <ReplyButton text="Button4" requestPoll />
            <ReplyButton text="Button5" requestPoll="quiz" />
          </KeyboardRow>

          <ReplyButton text="Button6" requestPoll="regular" />
        </ReplyKeyboard>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <ReplyKeyboard>
                  <ReplyButton
                    text="Button1"
                  />
                  <KeyboardRow>
                    <ReplyButton
                      requestContact={true}
                      text="Button2"
                    />
                    <ReplyButton
                      requestLocation={true}
                      text="Button3"
                    />
                  </KeyboardRow>
                  <KeyboardRow>
                    <ReplyButton
                      requestPoll={true}
                      text="Button4"
                    />
                    <ReplyButton
                      requestPoll="quiz"
                      text="Button5"
                    />
                  </KeyboardRow>
                  <ReplyButton
                    requestPoll="regular"
                    text="Button6"
                  />
                </ReplyKeyboard>,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "keyboard": Array [
                    Array [
                      Object {
                        "request_contact": undefined,
                        "request_location": undefined,
                        "request_poll": undefined,
                        "text": "Button1",
                      },
                    ],
                    Array [
                      Object {
                        "request_contact": true,
                        "request_location": undefined,
                        "request_poll": undefined,
                        "text": "Button2",
                      },
                      Object {
                        "request_contact": undefined,
                        "request_location": true,
                        "request_poll": undefined,
                        "text": "Button3",
                      },
                    ],
                    Array [
                      Object {
                        "request_contact": undefined,
                        "request_location": undefined,
                        "request_poll": Object {
                          "type": undefined,
                        },
                        "text": "Button4",
                      },
                      Object {
                        "request_contact": undefined,
                        "request_location": undefined,
                        "request_poll": Object {
                          "type": "quiz",
                        },
                        "text": "Button5",
                      },
                    ],
                    Array [
                      Object {
                        "request_contact": undefined,
                        "request_location": undefined,
                        "request_poll": Object {
                          "type": "regular",
                        },
                        "text": "Button6",
                      },
                    ],
                  ],
                  "one_time_keyboard": undefined,
                  "resize_keyboard": undefined,
                  "selective": undefined,
                },
              },
            ]
          `);

    await expect(
      render(
        <ReplyKeyboard resizeKeyboard oneTimeKeyboard selective>
          <KeyboardRow>
            <ReplyButton text="Button1" />
            <ReplyButton text="Button2" />
          </KeyboardRow>
        </ReplyKeyboard>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <ReplyKeyboard
                  oneTimeKeyboard={true}
                  resizeKeyboard={true}
                  selective={true}
                >
                  <KeyboardRow>
                    <ReplyButton
                      text="Button1"
                    />
                    <ReplyButton
                      text="Button2"
                    />
                  </KeyboardRow>
                </ReplyKeyboard>,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "keyboard": Array [
                    Array [
                      Object {
                        "request_contact": undefined,
                        "request_location": undefined,
                        "request_poll": undefined,
                        "text": "Button1",
                      },
                      Object {
                        "request_contact": undefined,
                        "request_location": undefined,
                        "request_poll": undefined,
                        "text": "Button2",
                      },
                    ],
                  ],
                  "one_time_keyboard": true,
                  "resize_keyboard": true,
                  "selective": true,
                },
              },
            ]
          `);
  });
});

describe('RemoveReplyKeyboard', () => {
  test('match snapshot', async () => {
    await expect(render(<RemoveReplyKeyboard />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <RemoveReplyKeyboard />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "remove_keyboard": true,
                  "selective": undefined,
                },
              },
            ]
          `);

    await expect(render(<RemoveReplyKeyboard selective />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <RemoveReplyKeyboard
                  selective={true}
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "remove_keyboard": true,
                  "selective": true,
                },
              },
            ]
          `);
  });
});

describe('ForceReply', () => {
  test('match snapshot', async () => {
    await expect(render(<ForceReply />)).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <ForceReply />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "force_reply": true,
                  "selective": undefined,
                },
              },
            ]
          `);

    await expect(render(<ForceReply selective />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <ForceReply
                  selective={true}
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "force_reply": true,
                  "selective": true,
                },
              },
            ]
          `);
  });
});
