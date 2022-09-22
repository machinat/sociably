import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { renderPartElement } from './utils';
import { UrlButton } from '../UrlButton';

it('is valid Component', () => {
  expect(typeof UrlButton).toBe('function');
  expect(isNativeType(<UrlButton url="" title="" />)).toBe(true);
  expect(UrlButton.$$platform).toBe('facebook');
});

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
