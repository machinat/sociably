import Sociably from '@sociably/core';
import Renderer from '@sociably/core/renderer';
import { isNativeType } from '@sociably/core/utils';

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
} from '../replyMarkup.js';

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
    await expect(render(<UrlButton text="Go" url="http://sociably.io" />))
      .resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <UrlButton
            text="Go"
            url="http://sociably.io"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
            "text": "Go",
            "url": "http://sociably.io",
          },
        },
      ]
    `);
  });

  test('login mode match snapshot', async () => {
    await expect(
      render(<UrlButton login text="Go and Log in" url="http://sociably.io" />)
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <UrlButton
            login={true}
            text="Go and Log in"
            url="http://sociably.io"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
            "login_url": {
              "bot_username": undefined,
              "forward_text": undefined,
              "request_write_access": undefined,
              "url": "http://sociably.io",
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
          url="http://sociably.io"
          forwardText="Forwarded Login"
          botUserName="R2"
          requestWriteAccess
        />
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <UrlButton
            botUserName="R2"
            forwardText="Forwarded Login"
            login={true}
            requestWriteAccess={true}
            text="Go and Log in"
            url="http://sociably.io"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
            "login_url": {
              "bot_username": "R2",
              "forward_text": "Forwarded Login",
              "request_write_access": true,
              "url": "http://sociably.io",
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
      [
        {
          "node": <CallbackButton
            data="World!"
            text="Hello"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
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
      [
        {
          "node": <SwitchQueryButton
            text="Try"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
            "switch_inline_query": "",
            "text": "Try",
          },
        },
      ]
    `);
    await expect(render(<SwitchQueryButton text="Try" query="foo" />)).resolves
      .toMatchInlineSnapshot(`
      [
        {
          "node": <SwitchQueryButton
            query="foo"
            text="Try"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
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
      [
        {
          "node": <SwitchQueryButton
            currentChat={true}
            text="Try"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
            "switch_inline_query_current_chat": "",
            "text": "Try",
          },
        },
      ]
    `);
    await expect(
      render(<SwitchQueryButton currentChat text="Try" query="foo" />)
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <SwitchQueryButton
            currentChat={true}
            query="foo"
            text="Try"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
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
      [
        {
          "node": <GameButton
            text="Play"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
            "callback_game": {},
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
      [
        {
          "node": <PayButton
            text="$$$"
          />,
          "path": "$#container",
          "type": "part",
          "value": {
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
          <UrlButton text="Go" url="http://sociably.io" />

          <KeyboardRow>
            <CallbackButton text="Hello" data="World!" />
            <SwitchQueryButton text="Try" />
          </KeyboardRow>
        </InlineKeyboard>
      )
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "node": <InlineKeyboard>
            <UrlButton
              text="Go"
              url="http://sociably.io"
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
          "value": {
            "inline_keyboard": [
              [
                {
                  "text": "Go",
                  "url": "http://sociably.io",
                },
              ],
              [
                {
                  "callback_data": "World!",
                  "text": "Hello",
                },
                {
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
      [
        {
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
          "value": {
            "keyboard": [
              [
                {
                  "text": "Button1",
                },
              ],
              [
                {
                  "request_contact": true,
                  "text": "Button2",
                },
                {
                  "request_location": true,
                  "text": "Button3",
                },
              ],
              [
                {
                  "request_poll": {
                    "type": undefined,
                  },
                  "text": "Button4",
                },
                {
                  "request_poll": {
                    "type": "quiz",
                  },
                  "text": "Button5",
                },
              ],
              [
                {
                  "request_poll": {
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
      [
        {
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
          "value": {
            "keyboard": [
              [
                {
                  "text": "Button1",
                },
                {
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
      [
        {
          "node": <RemoveReplyKeyboard />,
          "path": "$#container",
          "type": "part",
          "value": {
            "remove_keyboard": true,
            "selective": undefined,
          },
        },
      ]
    `);

    await expect(render(<RemoveReplyKeyboard selective />)).resolves
      .toMatchInlineSnapshot(`
      [
        {
          "node": <RemoveReplyKeyboard
            selective={true}
          />,
          "path": "$#container",
          "type": "part",
          "value": {
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
      [
        {
          "node": <ForceReply />,
          "path": "$#container",
          "type": "part",
          "value": {
            "force_reply": true,
            "selective": undefined,
          },
        },
      ]
    `);

    await expect(render(<ForceReply selective />)).resolves
      .toMatchInlineSnapshot(`
      [
        {
          "node": <ForceReply
            selective={true}
          />,
          "path": "$#container",
          "type": "part",
          "value": {
            "force_reply": true,
            "selective": true,
          },
        },
      ]
    `);
  });
});
