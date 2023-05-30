import { makeUnitSegment } from '@sociably/core/renderer';
import type { UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import { PATH_TAKE_THREAD_CONTROL } from '../constant.js';
import type { FacebookComponent, TakeThreadControlValue } from '../types.js';

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
export const TakeThreadContorl: FacebookComponent<
  TakeThreadContorlProps,
  UnitSegment<TakeThreadControlValue>
> = makeFacebookComponent(function TakeThreadContorl(node, path) {
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_TAKE_THREAD_CONTROL,
      params: { metadata: node.props.metadata },
    }),
  ];
});
