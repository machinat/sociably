// @flow
import type { SegmentWithoutPause } from 'machinat-base/types';

const createJobs = (
  actions: null | SegmentWithoutPause<MessageActionValue, MessageComponent>[]
) => {
  if (actions === null) {
    return null;
  }

  const jobs: WebMessageJob[] = new Array(actions.length);

  for (let i = 0; i < actions.length; i += 1) {
    const { value } = actions[i];
    jobs[i] = {
      channelId: this.uid,
      message:
        typeof value === 'string'
          ? { type: 'message', subtype: 'text', payload: value }
          : value,
    };
  }

  return jobs;
};
