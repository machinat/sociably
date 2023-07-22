import Sociably from '@sociably/core';
import { renderPartElement, makeTestComponent } from './utils.js';
import { UrlButton as _UrlButton } from '../UrlButton.js';

const UrlButton = makeTestComponent(_UrlButton);

it('match snapshot', async () => {
  await expect(
    renderPartElement(
      <UrlButton title="my button" url="http://sociably.js.org" />
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <UrlButton
          title="my button"
          url="http://sociably.js.org"
        />,
        "path": "$#container",
        "type": "part",
        "value": {
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
    [
      {
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
        "value": {
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
