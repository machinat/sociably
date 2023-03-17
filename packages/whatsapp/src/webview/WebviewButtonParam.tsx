import Sociably, { makeContainer, RenderingThread } from '@sociably/core';
import { posix as posixPath } from 'path';
import WhatsAppChat from '../Chat';
import { UrlButtonParam } from '../components';
import ServerAuthenticator from './ServerAuthenticator';

type WebviewButtonParamProps = {
  /** The webview page to open */
  page?: string;
  /**
   * The 0-indexed position of the button. If the value is undefined, it's
   * decided by the order of params.
   */
  index?: number;
};

const WebviewButtonParam =
  (authenticator: ServerAuthenticator, thread: RenderingThread) =>
  ({ page, index }: WebviewButtonParamProps) => {
    if (!thread || !(thread instanceof WhatsAppChat)) {
      return null;
    }

    const urlSuffix = authenticator.getAuthUrlSuffix(
      thread.customerNumber,
      page ? posixPath.join('.', page) : undefined
    );
    return <UrlButtonParam urlSuffix={urlSuffix} index={index} />;
  };

export default makeContainer({
  deps: [ServerAuthenticator, RenderingThread],
})(WebviewButtonParam);
