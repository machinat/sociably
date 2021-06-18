import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeType } from '@machinat/core/utils';

import {
  UrlButton,
  CallbackButton,
  SwitchQueryButton,
  GameButton,
  PayButton,
  InlineKeyboard,
  TextReply,
  ContactReply,
  LocationReply,
  PollReply,
  KeyboardRow,
  ReplyKeyboard,
  RemoveReplyKeyboard,
  ForceReply,
} from '../replyMarkup';

const render = async (node) => {
  let rendered;
  const renderer = new Renderer('telegram', async (_, __, renderInner) => {
    rendered = await renderInner(node, null as never);
    return null;
  });

  await renderer.render(<container />, null as never);
  return rendered;
};

test.each([
  UrlButton,
  CallbackButton,
  SwitchQueryButton,
  GameButton,
  PayButton,
  InlineKeyboard,
  TextReply,
  ContactReply,
  LocationReply,
  PollReply,
  KeyboardRow,
  ReplyKeyboard,
  RemoveReplyKeyboard,
  ForceReply,
])('is valid Component', (Component: any) => {
  expect(typeof Component).toBe('function');
  expect(isNativeType(<Component />)).toBe(true);
  expect(Component.$$platform).toBe('telegram');
});

describe('UrlButton', () => {
  test('non login mode match snapshot', async () => {
    await expect(render(<UrlButton text="Go" url="http://machinat.com" />))
      .resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <UrlButton
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
      render(<UrlButton login text="Go and Log in" url="http://machinat.com" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <UrlButton
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
        <UrlButton
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
                "node": <UrlButton
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

describe('SwitchQueryButton', () => {
  test('match snapshot', async () => {
    await expect(render(<SwitchQueryButton text="Try" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <SwitchQueryButton
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
    await expect(render(<SwitchQueryButton text="Try" query="foo" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <SwitchQueryButton
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
    await expect(render(<SwitchQueryButton currentChat text="Try" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <SwitchQueryButton
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
      render(<SwitchQueryButton currentChat text="Try" query="foo" />)
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <SwitchQueryButton
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

describe('GameButton', () => {
  test('match snapshot', async () => {
    await expect(render(<GameButton text="Play" />)).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <GameButton
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
          <UrlButton text="Go" url="http://machinat.com" />

          <KeyboardRow>
            <CallbackButton text="Hello" data="World!" />
            <SwitchQueryButton text="Try" />
          </KeyboardRow>
        </InlineKeyboard>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <InlineKeyboard>
                  <UrlButton
                    text="Go"
                    url="http://machinat.com"
                  />
                  <KeyboardRow>
                    <CallbackButton
                      data="World!"
                      text="Hello"
                    />
                    <SwitchQueryButton
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
          <TextReply text="Button1" />

          <KeyboardRow>
            <ContactReply text="Button2" />
            <LocationReply text="Button3" />
          </KeyboardRow>

          <KeyboardRow>
            <PollReply text="Button4" />
            <PollReply text="Button5" type="quiz" />
          </KeyboardRow>

          <PollReply text="Button6" type="regular" />
        </ReplyKeyboard>
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <ReplyKeyboard>
                  <TextReply
                    text="Button1"
                  />
                  <KeyboardRow>
                    <ContactReply
                      text="Button2"
                    />
                    <LocationReply
                      text="Button3"
                    />
                  </KeyboardRow>
                  <KeyboardRow>
                    <PollReply
                      text="Button4"
                    />
                    <PollReply
                      text="Button5"
                      type="quiz"
                    />
                  </KeyboardRow>
                  <PollReply
                    text="Button6"
                    type="regular"
                  />
                </ReplyKeyboard>,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "keyboard": Array [
                    Array [
                      Object {
                        "text": "Button1",
                      },
                    ],
                    Array [
                      Object {
                        "request_contact": true,
                        "text": "Button2",
                      },
                      Object {
                        "request_location": true,
                        "text": "Button3",
                      },
                    ],
                    Array [
                      Object {
                        "request_poll": Object {
                          "type": undefined,
                        },
                        "text": "Button4",
                      },
                      Object {
                        "request_poll": Object {
                          "type": "quiz",
                        },
                        "text": "Button5",
                      },
                    ],
                    Array [
                      Object {
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
            <TextReply text="Button1" />
            <TextReply text="Button2" />
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
                    <TextReply
                      text="Button1"
                    />
                    <TextReply
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
                        "text": "Button1",
                      },
                      Object {
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
