import { posix as posixPath } from 'path';
import Sociably, { makeContainer, RenderingThread } from '@sociably/core';
import TwitterChat from '../Chat';
import { UrlButton } from '../components';
import ServerAuthenticator from './ServerAuthenticator';

type WebviewButtonProps = {
  /** The text that will be displayed to the user on each button. Max string length of 36 characters */
  label: string;
  /** The webview page to open */
  page?: string;
};

const WebviewButton =
  (authenticator: ServerAuthenticator, thread: RenderingThread) =>
  ({ label, page }: WebviewButtonProps) => {
    if (!thread || !(thread instanceof TwitterChat)) {
      return null;
    }

    const url = authenticator.getAuthUrl(
      thread.id,
      page ? posixPath.join('.', page) : undefined
    );
    return <UrlButton label={label} url={url} />;
  };

export default makeContainer({
  deps: [ServerAuthenticator, RenderingThread],
})(WebviewButton);
