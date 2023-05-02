import Sociably, { serviceContainer, RenderingTarget } from '@sociably/core';
import { UriAction } from '../components';
import LineChannel from '../Channel';
import LineChat from '../Chat';
import ServerAuthenticator from './ServerAuthenticator';

type WebviewActionProps = {
  /** Label for the action */
  label?: string;
  /** The webview page to open */
  page?: string;
};

const WebviewAction =
  (authenticator: ServerAuthenticator, target: RenderingTarget) =>
  async ({ label, page }: WebviewActionProps) => {
    if (!target || !(target instanceof LineChat)) {
      throw new Error('WebviewAction can only be used in a LineChat');
    }

    const url = await authenticator.getLiffUrl(
      new LineChannel(target.channelId),
      page,
      target
    );
    return <UriAction label={label} uri={url} />;
  };

export default serviceContainer({
  deps: [ServerAuthenticator, RenderingTarget],
})(WebviewAction);
