import { makePartSegment } from '@sociably/core/renderer';
import type { PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import type { FacebookComponent } from '../types';

/**
 * @category Props
 */
export type LoginButtonProps = {
  /** Authentication callback URL. Must use HTTPS protocol. */
  url: string;
};

/**
 * The log in button triggers the [account linking authentication flow](https://developers.facebook.com/docs/messenger-platform/account-linking/authentication).
 * @category Component
 * @props {@link LoginButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#login)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/login).
 */
export const LoginButton: FacebookComponent<
  LoginButtonProps,
  PartSegment<{}>
> = makeFacebookComponent(function LoginButton(node, path) {
  const { url } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'account_link',
      url,
    }),
  ];
});
