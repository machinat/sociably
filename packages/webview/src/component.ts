/* eslint-disable import/prefer-default-export */
import { annotateNativeComponent, unitSegment } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { NativeComponent } from '@machinat/core/types';
import type { EventInput } from '@machinat/websocket/types';
import { WEBVIEW } from './constant';

type EventProps = {
  kind?: string;
  type: string;
  payload?: any;
};

/** @internal */
const __Event = function Event(node, path) {
  const { type, kind, payload } = node.props;
  return [
    unitSegment(node, path, {
      kind,
      type,
      payload,
    }),
  ];
};

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventProps,
  UnitSegment<EventInput>
> = annotateNativeComponent(WEBVIEW)(__Event);
