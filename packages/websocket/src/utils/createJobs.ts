import type { DispatchableSegment } from '@sociably/core/engine';
import { DispatchTarget, EventInput, WebSocketJob } from '../types.js';

const createJobs = (
  thread: DispatchTarget,
  segments: DispatchableSegment<EventInput>[],
): WebSocketJob[] => [
  {
    target: thread,
    values: segments.map((seg) =>
      seg.type === 'text'
        ? {
            category: 'message',
            type: 'text',
            payload: seg.value,
          }
        : seg.value,
    ),
  },
];

export default createJobs;
