import { posix as posixPath } from 'path';
import Sociably, { serviceContainer, RenderingTarget } from '@sociably/core';
import TwitterChat from '../Chat.js';
import { UrlButton } from '../components/index.js';
import ServerAuthenticator from './ServerAuthenticator.js';

type WebviewButtonProps = {
  /**
   * The text that will be displayed to the user on each button. Max string
   * length of 36 characters
   */
  label: string;
  /** The webview page to open */
  page?: string;
};

const WebviewButton =
  (authenticator: ServerAuthenticator, thread: RenderingTarget) =>
  ({ label, page }: WebviewButtonProps) => {
    if (!thread || !(thread instanceof TwitterChat)) {
      return null;
    }

    const url = authenticator.getAuthUrl(
      thread.agentId,
      thread.userId,
      page ? posixPath.join('.', page) : undefined,
    );
    return <UrlButton label={label} url={url} />;
  };

export default serviceContainer({
  deps: [ServerAuthenticator, RenderingTarget],
})(WebviewButton);
