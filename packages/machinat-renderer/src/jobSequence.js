// @flow
import invariant from 'invariant';
import delay from 'delay';
import { isImmediate } from 'machinat-shared';

import type { BatchesAndSeparators, RenderDelegate } from './types';

type CreateJobs<Rendered, Job> = $PropertyType<
  RenderDelegate<Rendered, Job>,
  'createJobsFromRendered'
>;

export default class JobSequence<Rendered, Job> {
  curSeq: number;
  sequence: BatchesAndSeparators;
  createJobs: CreateJobs<Rendered, Job>;
  payload: any;

  constructor(
    renderedSepuence: BatchesAndSeparators,
    payload: any,
    createJobs: CreateJobs<Rendered, Job>
  ) {
    this.sequence = renderedSepuence;
    this.payload = payload;
    this.createJobs = createJobs;
    this.curSeq = 0;
  }

  next(): Promise<void> | Array<Job> {
    for (; this.curSeq < this.sequence.length; this.curSeq += 1) {
      const action = this.sequence[this.curSeq];
      if (isImmediate(action)) {
        const { after, delay: timeToDelay } = action.props;
        let promise;

        if (timeToDelay !== undefined) {
          promise = delay(timeToDelay);
        }

        if (after !== undefined) {
          invariant(
            typeof after === 'function',
            `"after" prop of Immediate element should be a function, got ${after}`
          );

          promise = promise === undefined ? after() : promise.then(after);
        }

        if (promise !== undefined) {
          this.curSeq += 1;
          return promise;
        }
      } else {
        this.curSeq += 1;
        return this.createJobs(action, this.payload);
      }
    }

    return Promise.resolve();
  }

  hasNext() {
    return this.curSeq < this.sequence.length;
  }

  reset() {
    this.curSeq = 0;
  }
}
