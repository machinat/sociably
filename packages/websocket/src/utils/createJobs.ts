import type { DispatchableSegment } from '@machinat/core/engine';
import { DispatchTarget, EventInput, WebSocketJob } from '../types';

const createJobs = (
  channel: DispatchTarget,
  segments: DispatchableSegment<EventInput>[]
): WebSocketJob[] => {
  return [
    {
      target: channel,
      values: segments.map((seg) =>
        seg.type === 'text'
          ? {
              category: 'message',
              type: 'text',
              payload: seg.value,
            }
          : seg.value
      ),
    },
  ];
};

export default createJobs;
