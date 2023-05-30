import { makeUnitSegment } from '@sociably/core/renderer';
import type { UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import { PATH_REQUEST_THREAD_CONTROL } from '../constant.js';
import type { FacebookComponent, RequestThreadControlValue } from '../types.js';

/**
 * @category Props
 */
export type RequestThreadControlProps = {
  /**
   * Metadata passed back to the primary app in the request_thread_control
   * webhook event.
   */
  metadata?: string;
};

/**
 * Ask for control of a specific thread as a Secondary Receiver app. The Primary
 * Receiver app will receive a messaging_handovers webhook event with the
 * request_thread_control property when/request_thread_control` is called.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/handover-protocol/request-thread-control).
 */
export const RequestThreadControl: FacebookComponent<
  RequestThreadControlProps,
  UnitSegment<RequestThreadControlValue>
> = makeFacebookComponent(function RequestThreadControl(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_REQUEST_THREAD_CONTROL,
      params: { metadata: node.props.metadata },
    }),
  ];
});
