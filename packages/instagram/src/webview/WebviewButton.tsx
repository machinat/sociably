import Sociably, { serviceContainer, RenderingTarget } from '@sociably/core';
import { posix as posixPath } from 'path';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import { UrlButton } from '../components/index.js';
import ServerAuthenticator from './ServerAuthenticator.js';

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
  (authenticator: ServerAuthenticator, thread: RenderingTarget) =>
  ({
    title,
    page,
    webviewHeightRatio,
    hideShareButton,
  }: WebviewButtonProps) => {
    if (
      !thread ||
      !(thread instanceof InstagramChat) ||
      !('id' in thread.target)
    ) {
      throw new Error(
        'WebviewButton can only be used in the InstagramChat with a user ID'
      );
    }

    const url = authenticator.getAuthUrl(
      new InstagramUser(thread.pageId, thread.target.id),
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

export default serviceContainer({
  deps: [ServerAuthenticator, RenderingTarget],
})(WebviewButton);
