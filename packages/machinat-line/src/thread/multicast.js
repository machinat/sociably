// @flow
import invariant from 'invariant';
import { formatElement } from 'machinat-utility';

import type { MachinatThread, ActionWithoutPause } from 'machinat-base/types';
import type { LineJob, LineActionValue, LineComponent } from '../types';

import { makeMessageFromString, isMessage } from './utils';

const MULTICAST_PATH = 'message/multicast';
const MULTICAST_UID = 'line:default:multicast';

class LineMulticastThread implements MachinatThread<LineJob, void> {
  to: string[];

  platform = 'line';
  type = 'multicast';
  allowPause = false;

  constructor(to: string[]) {
    this.to = to;
  }

  // eslint-disable-next-line class-methods-use-this
  uid() {
    return MULTICAST_UID;
  }

  createJobs(actions: ActionWithoutPause<LineActionValue, LineComponent>[]) {
    const jobs: LineJob[] = [];
    let messages: LineActionValue[] = [];

    for (let i = 0; i < actions.length; i += 1) {
      const { element, value } = actions[i];

      invariant(
        isMessage(element),
        `${formatElement(element)} is invalid to be delivered in multicast`
      );

      messages.push(
        typeof value === 'string' ? makeMessageFromString(value) : value
      );

      if (messages.length === 5 || i === actions.length - 1) {
        jobs.push({
          entry: MULTICAST_PATH,
          threadId: this.uid(),
          body: { to: (this.to: string[]), messages },
        });
        messages = [];
      }
    }

    return jobs;
  }
}

export default LineMulticastThread;
