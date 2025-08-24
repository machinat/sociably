import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { PATH_MESSAGES } from '../constant.js';
import type { MessageValue } from '../types.js';

/** @category Props */
export type RequestOneTimeNotifProps = {
  /** The title to be displayed in the request message, limited to 65 characters. */
  title: string;
  /** The data to be posted back with the `one_time_notif_optin` event. */
  payload: string;
};

export function RequestOneTimeNotif(
  node: NativeElement<RequestOneTimeNotifProps, AnyNativeComponent>,
  path: string,
): UnitSegment<MessageValue>[] {
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
}
