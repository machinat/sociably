import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { PATH_TAKE_THREAD_CONTROL } from '../constant.js';
import type { TakeThreadControlValue } from '../types.js';

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

export function TakeThreadContorl(
  node: NativeElement<TakeThreadContorlProps, AnyNativeComponent>,
  path: string
): UnitSegment<TakeThreadControlValue>[] {
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_TAKE_THREAD_CONTROL,
      params: { metadata: node.props.metadata },
    }),
  ];
}
