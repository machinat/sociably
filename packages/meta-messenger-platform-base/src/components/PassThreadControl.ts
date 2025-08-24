import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { PATH_PASS_THREAD_CONTROL } from '../constant.js';
import type { PassThreadControlValue } from '../types.js';

/** @category Props */
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

export function PassThreadControl(
  node: NativeElement<PassThreadControlProps, AnyNativeComponent>,
  path: string,
): UnitSegment<PassThreadControlValue>[] {
  const { targetAppId, metadata } = node.props;
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_PASS_THREAD_CONTROL,
      params: { target_app_id: targetAppId, metadata },
    }),
  ];
}
