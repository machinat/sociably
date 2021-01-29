import type { DispatchableSegment } from '@machinat/core/engine/types';
import {
  WebSocketTopicChannel,
  WebSocketUserChannel,
  WebSocketConnection,
} from '../channel';
import { EventInput, WebSocketJob } from '../types';

const createJobs = (
  channel: WebSocketTopicChannel | WebSocketUserChannel | WebSocketConnection,
  segments: DispatchableSegment<EventInput>[]
): WebSocketJob[] => {
  return [
    {
      target: channel,
      values: segments.map((seg) =>
        seg.type === 'text'
          ? {
              kind: 'message',
              type: 'text',
              payload: seg.value,
            }
          : seg.value
      ),
    },
  ];
};

export default createJobs;
