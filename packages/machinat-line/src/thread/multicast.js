// @flow
import invariant from 'invariant';
import { formatElement } from 'machinat-utility';

import type { MachinatThread, ActionWithoutPause } from 'machinat-base/types';
import type { LineJob, LineActionValue, LineComponent } from '../types';

import { makeMessageFromString, isMessage } from './utils';

const MULTICAST_PATH = 'message/multicast';

class LineMulticastThread implements MachinatThread<LineJob, void> {
  targets: string[];

  platform = 'line';
  type = 'multicast';
  uid = 'line:default:multicast:*';
  allowPause = false;

  constructor(targets: string[]) {
    this.targets = targets;
  }

  createJobs(
    actions: null | ActionWithoutPause<LineActionValue, LineComponent>[]
  ) {
    if (actions === null) {
      return null;
    }

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
          threadId: this.uid,
          body: { to: (this.targets: string[]), messages },
        });
        messages = [];
      }
    }

    return jobs;
  }
}

export default LineMulticastThread;
