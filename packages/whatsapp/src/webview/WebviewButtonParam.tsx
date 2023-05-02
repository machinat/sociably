import Sociably, { serviceContainer, RenderingTarget } from '@sociably/core';
import { posix as posixPath } from 'path';
import WhatsAppChat from '../Chat';
import UserProfile from '../UserProfile';
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
  /** Pass `user.profile` on the auth context while login */
  userProfile?: UserProfile;
};

const WebviewButtonParam =
  (authenticator: ServerAuthenticator, thread: RenderingTarget) =>
  ({ page, index }: WebviewButtonParamProps) => {
    if (!thread || !(thread instanceof WhatsAppChat)) {
      throw new Error('WebviewButtonParam can only be used in WhatsAppChat');
    }

    const urlPostfix = authenticator.getAuthUrlPostfix(
      thread,
      page ? posixPath.join('.', page) : undefined
    );
    return <UrlButtonParam urlPostfix={urlPostfix} index={index} />;
  };

export default serviceContainer({
  deps: [ServerAuthenticator, RenderingTarget],
})(WebviewButtonParam);
