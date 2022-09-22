import { makeUnitSegment } from '@sociably/core/renderer';
import type { UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { PATH_MESSAGES } from '../constant';
import type { MessageValue, FacebookComponent } from '../types';

/**
 * @category Props
 */
export type RequestOneTimeNotifProps = {
  /** The title to be displayed in the request message, limited to 65 characters. */
  title: string;
  /** The data to be posted back with the `one_time_notif_optin` event. */
  payload: string;
};

/**
 * The Messenger Platform's One-Time Notification API (Beta) allows a page to
 * request a user to send one follow-up message after 24-hour messaging window
 * have ended. The user will be offered to receive a future notification. Once
 * the user asks to be notified, the page will receive a token which is an
 * equivalent to a permission to send a single message to the user. The token
 * can only be used once and will expire within 1 year of creation.
 * @category Component
 * @props {@link RequestOneTimeNotifProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/one-time-notification).
 */
export const RequestOneTimeNotif: FacebookComponent<
  RequestOneTimeNotifProps,
  UnitSegment<MessageValue>
> = makeFacebookComponent(function RequestOneTimeNotif(node, path) {
  const { title, payload } = node.props;
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_MESSAGES,
      params: {
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'one_time_notif_req',
              title,
              payload,
            },
          },
        },
      },
    }),
  ];
});
