import { posix as posixPath } from 'path';
import Machinat, { makeContainer } from '@machinat/core';
import { UrlButton } from '../components';
import ServerAuthenticator from './ServerAuthenticator';

type WebviewButtonProps = {
  /** Label text on the button. */
  text: string;
  /** The webview page to open */
  page?: string;
  /** New text of the button in forwarded messages. */
  forwardText?: string;
  /** Username of a bot, which will be used for user authorization. If not specified, the current bot's username will be assumed. The url's domain must be the same as the domain linked with the bot. */
  botUserName?: string;
  /** Pass True to request the permission for your bot to send messages to the user. */
  requestWriteAccess?: boolean;
};

const WebviewButton =
  (authenticator: ServerAuthenticator) =>
  ({
    text,
    page,
    forwardText,
    botUserName,
    requestWriteAccess,
  }: WebviewButtonProps) => {
    const url = authenticator.getAuthUrl(
      page ? posixPath.join('.', page) : undefined
    );
    return (
      <UrlButton
        login
        text={text}
        url={url}
        forwardText={forwardText}
        botUserName={botUserName}
        requestWriteAccess={requestWriteAccess}
      />
    );
  };

export default makeContainer({
  deps: [ServerAuthenticator],
})(WebviewButton);
