import { makeUnitSegment } from '@sociably/core/renderer';
import type { UnitSegment } from '@sociably/core/renderer';
import { makeMessengerComponent } from '../utils';
import {
  API_PATH,
  PATH_PASS_THREAD_CONTROL,
  PATH_REQUEST_THREAD_CONTROL,
  PATH_TAKE_THREAD_CONTROL,
} from '../constant';
import type {
  MessengerComponent,
  TakeThreadControlValue,
  PassThreadControlValue,
  RequestThreadControlValue,
} from '../types';

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
export const PassThreadControl: MessengerComponent<
  PassThreadControlProps,
  UnitSegment<PassThreadControlValue>
> = makeMessengerComponent(function PassThreadControl(node, path) {
  const { targetAppId, metadata } = node.props;
  return [
    makeUnitSegment(node, path, {
      target_app_id: targetAppId,
      metadata,
      [API_PATH]: PATH_PASS_THREAD_CONTROL,
    }),
  ];
});

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
export const RequestThreadControl: MessengerComponent<
  RequestThreadControlProps,
  UnitSegment<RequestThreadControlValue>
> = makeMessengerComponent(function RequestThreadControl(node, path) {
  return [
    makeUnitSegment(node, path, {
      metadata: node.props.metadata,
      [API_PATH]: PATH_REQUEST_THREAD_CONTROL,
    }),
  ];
});

/**
 * @category Props
 */
export type TakeThreadContorlProps = {
  /**
   * Metadata passed back to the secondary app in the take_thread_control
   * webhook event.
   */
  metadata?: string;
};

/**
 * Take control of a specific thread from a Secondary Receiver app as the
 * Primary Receiver app. The Secondary Receiver app will receive a
 * take_thread_control webhook event when it loses thread control.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/handover-protocol)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/handover-protocol/take-thread-control).
 */
export const TakeThreadContorl: MessengerComponent<
  TakeThreadContorlProps,
  UnitSegment<TakeThreadControlValue>
> = makeMessengerComponent(function TakeThreadContorl(node, path) {
  return [
    makeUnitSegment(node, path, {
      metadata: node.props.metadata,
      [API_PATH]: PATH_TAKE_THREAD_CONTROL,
    }),
  ];
});
