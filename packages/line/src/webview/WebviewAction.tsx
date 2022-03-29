import Machinat, { makeContainer } from '@machinat/core';
import { UriAction } from '../components';
import ServerAuthenticator from './ServerAuthenticator';

type WebviewActionProps = {
  /** Label for the action */
  label?: string;
  /** The webview page to open */
  page?: string;
};

const WebviewAction =
  (authenticator: ServerAuthenticator) =>
  ({ label, page }: WebviewActionProps) => {
    const url = authenticator.getLiffUrl(page);
    return <UriAction label={label} uri={url} />;
  };

export default makeContainer({
  deps: [ServerAuthenticator],
})(WebviewAction);
