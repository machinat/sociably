import { makePartSegment } from '@sociably/core/renderer';
import type { PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import type { FacebookComponent } from '../types.js';

/**
 * @category Props
 */
export type UrlButtonProps = {
  /** Button title. 20 character limit. */
  title: string;
  /**
   * This URL is opened in a mobile browser when the button is tapped. Must use
   * HTTPS protocol if messenger_extensions is true.
   */
  url: string;
  /**
   * The URL to use on clients that don't support Messenger Extensions. If this
   * is not defined, the url will be used as the fallback. It may only be
   * specified if messenger_extensions is true.
   */
  fallbackUrl?: string;
  /** Must be true if using Messenger Extensions. */
  messengerExtensions?: boolean;
  /** Height of the Webview. */
  webviewHeightRatio?: 'compact' | 'tall' | 'full';
  /** Set to `true` to disable the share button in the Webview (for sensitive info) */
  hideShareButton?: boolean;
};

/**
 * The URL Button opens a webpage in the Messenger webview. This button can be
 * used with the Button and Generic Templates.
 * @category Component
 * @props {@link UrlButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/reference/buttons/url)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#url).
 */
export const UrlButton: FacebookComponent<
  UrlButtonProps,
  PartSegment<{}>
> = makeFacebookComponent(function UrlButton(node, path) {
  const {
    title,
    url,
    fallbackUrl,
    messengerExtensions,
    webviewHeightRatio,
    hideShareButton,
  } = node.props;

  return [
    makePartSegment(node, path, {
      type: 'web_url',
      title,
      url,
      webview_height_ratio: webviewHeightRatio,
      messenger_extensions: messengerExtensions,
      fallback_url: fallbackUrl,
      webview_share_button: hideShareButton ? 'hide' : undefined,
    }),
  ];
});
