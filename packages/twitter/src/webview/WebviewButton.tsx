import { join as joinPath } from 'path';
import Machinat, { makeContainer, RenderingChannel } from '@machinat/core';
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
  (authenticator: ServerAuthenticator, channel: RenderingChannel) =>
  ({ label, page }: WebviewButtonProps) => {
    if (!channel || !(channel instanceof TwitterChat)) {
      return null;
    }

    const url = authenticator.getAuthUrl(
      channel.id,
      page ? joinPath('.', page) : undefined
    );
    return <UrlButton label={label} url={url} />;
  };

export default makeContainer({
  deps: [ServerAuthenticator, RenderingChannel],
})(WebviewButton);
