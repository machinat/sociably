import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

/** @category Props */
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
  /**
   * Set to `true` to disable the share button in the Webview (for sensitive
   * info)
   */
  hideShareButton?: boolean;
};

export function UrlButton(
  node: NativeElement<UrlButtonProps, AnyNativeComponent>,
  path: string,
): PartSegment<{}>[] {
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
}
