/* eslint-disable import/prefer-default-export */
import { annotateNativeComponent, unitSegment } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { NativeComponent } from '@machinat/core/types';
import { WEBSOCKET } from './constant';
import type { CustomEventValue } from './types';

type EventProps = {
  type: Exclude<string, 'connect' | 'disconnect'>;
  subtype?: string;
  payload: any;
};

/** @internal */
const __Event = function Event(node, path) {
  const { type, subtype, payload } = node.props;
  return [
    unitSegment(node, path, {
      type: type || 'default',
      subtype,
      payload,
    }),
  ];
};

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventProps,
  UnitSegment<CustomEventValue>
> = annotateNativeComponent(WEBSOCKET)(__Event);
