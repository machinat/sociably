import Sociably, { makeContainer, RenderingThread } from '@sociably/core';
import { posix as posixPath } from 'path';
import FacebookChat from '../Chat';
import { UrlButton } from '../components';
import ServerAuthenticator from './ServerAuthenticator';

type WebviewButtonProps = {
  /** Button title. 20 character limit. */
  title: string;
  /** The webview page to open */
  page?: string;
  /** Height of the Webview. */
  webviewHeightRatio?: 'compact' | 'tall' | 'full';
  /** Set to `true` to disable the share button in the Webview (for sensitive info) */
  hideShareButton?: boolean;
};

const WebviewButton =
  (authenticator: ServerAuthenticator, thread: RenderingThread) =>
  ({
    title,
    page,
    webviewHeightRatio,
    hideShareButton,
  }: WebviewButtonProps) => {
    if (!thread || !(thread instanceof FacebookChat) || !thread.target) {
      return null;
    }

    const url = authenticator.getAuthUrl(
      thread.id,
      page ? posixPath.join('.', page) : undefined
    );
    return (
      <UrlButton
        title={title}
        url={url}
        hideShareButton={hideShareButton}
        webviewHeightRatio={webviewHeightRatio}
      />
    );
  };

export default makeContainer({
  deps: [ServerAuthenticator, RenderingThread],
})(WebviewButton);
