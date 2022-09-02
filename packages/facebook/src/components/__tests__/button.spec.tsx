import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderPartElement } from './utils';

import {
  UrlButton,
  PostbackButton,
  CallButton,
  LoginButton,
  LogoutButton,
  GamePlayButton,
} from '../button';

test.each([
  UrlButton,
  PostbackButton,
  CallButton,
  LoginButton,
  LogoutButton,
  GamePlayButton,
])('is valid Component', (Button) => {
  expect(typeof Button).toBe('function');
  expect(isNativeType(<Button {...({} as never)} />)).toBe(true);
  expect(Button.$$platform).toBe('facebook');
});

describe('UrlButton', () => {
  it('match snapshot', async () => {
    await expect(
      renderPartElement(
        <UrlButton title="my button" url="http://sociably.js.org" />
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <UrlButton
                  title="my button"
                  url="http://sociably.js.org"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "fallback_url": undefined,
                  "messenger_extensions": undefined,
                  "title": "my button",
                  "type": "web_url",
                  "url": "http://sociably.js.org",
                  "webview_height_ratio": undefined,
                  "webview_share_button": undefined,
                },
              },
            ]
          `);

    await expect(
      renderPartElement(
        <UrlButton
          title="my button"
          url="http://sociably.js.org"
          webviewHeightRatio="compact"
          messengerExtensions
          fallbackUrl="http://..."
          hideShareButton
        />
      )
    ).resolves.toMatchInlineSnapshot(`
            Array [
              Object {
                "node": <UrlButton
                  fallbackUrl="http://..."
                  hideShareButton={true}
                  messengerExtensions={true}
                  title="my button"
                  url="http://sociably.js.org"
                  webviewHeightRatio="compact"
                />,
                "path": "$#container",
                "type": "part",
                "value": Object {
                  "fallback_url": "http://...",
                  "messenger_extensions": true,
                  "title": "my button",
                  "type": "web_url",
                  "url": "http://sociably.js.org",
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
      renderPartElement(
        <PostbackButton title="my button" payload="_MY_PAYLOAD_" />
      )
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

describe('CallButton', () => {
  it('match snapshot', async () => {
    await expect(
      renderPartElement(
        <CallButton title="call me maybe" number="+15105551234" />
      )
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
    await expect(
      renderPartElement(<LoginButton url="https://council.elrond" />)
    ).resolves.toMatchInlineSnapshot(`
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
    await expect(
      renderPartElement(<LoginButton url="https://council.elrond" />)
    ).resolves.toMatchInlineSnapshot(`
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
    await expect(renderPartElement(<LogoutButton />)).resolves
      .toMatchInlineSnapshot(`
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
      renderPartElement(
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
