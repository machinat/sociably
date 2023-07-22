import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { PATH_REQUEST_THREAD_CONTROL } from '../constant.js';
import type { RequestThreadControlValue } from '../types.js';

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

export function RequestThreadControl(
  node: NativeElement<RequestThreadControlProps, AnyNativeComponent>,
  path: string
): UnitSegment<RequestThreadControlValue>[] {
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      apiPath: PATH_REQUEST_THREAD_CONTROL,
      params: { metadata: node.props.metadata },
    }),
  ];
}
