import { makeUnitSegment } from '@sociably/core/renderer';
import type { UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { PATH_PASS_THREAD_CONTROL } from '../constant';
import type { FacebookComponent, PassThreadControlValue } from '../types';

/**
 * @category Props
 */
export type PassThreadControlProps = {
  /**
   * The app ID to pass thread control to. Required if the Primary Receiver is
   * passing thread control. If the Secondary Receiver is passing thread
   * control, defaults to the app ID of the Primary Receiver. To pass thread
   * control to the Page inbox, use app ID 263902037430900.
   */
  targetAppId: number;
  /**
   * Metadata passed to the receiving app in the pass_thread_control webhook
   * event.
   */
  metadata?: string;
};

/**
 * Pass thread control from your app to another app. The app that will receive
 * thread ownership will receive a pass_thread_control webhook event.
 * @category Component
 * @props {@link PassThreadControlProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/handover-protocol/pass-thread-control).
 */
export const PassThreadControl: FacebookComponent<
  PassThreadControlProps,
  UnitSegment<PassThreadControlValue>
> = makeFacebookComponent(function PassThreadControl(node, path) {
  const { targetAppId, metadata } = node.props;
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_PASS_THREAD_CONTROL,
      params: { target_app_id: targetAppId, metadata },
    }),
  ];
});
