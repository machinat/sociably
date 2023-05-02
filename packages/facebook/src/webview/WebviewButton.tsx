import Sociably, { serviceContainer, RenderingTarget } from '@sociably/core';
import { posix as posixPath } from 'path';
import FacebookChat from '../Chat';
import FacebookUser from '../User';
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
  (authenticator: ServerAuthenticator, thread: RenderingTarget) =>
  ({
    title,
    page,
    webviewHeightRatio,
    hideShareButton,
  }: WebviewButtonProps) => {
    if (
      !thread ||
      !(thread instanceof FacebookChat) ||
      !('id' in thread.target)
    ) {
      throw new Error(
        'WebviewButton can only be used in the FacebookChat with a user ID'
      );
    }

    const url = authenticator.getAuthUrl(
      new FacebookUser(thread.pageId, thread.target.id),
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
