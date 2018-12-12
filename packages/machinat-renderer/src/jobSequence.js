// @flow
import invariant from 'invariant';
import delay from 'delay';
import { isImmediate } from 'machinat-shared';

import type {
  BatchesOrSeparators,
  RenderDelegate,
  JobOrSeparator,
} from './types';

type CreateJobs<Rendered, Job> = $PropertyType<
  RenderDelegate<Rendered, Job, any>,
  'createJobsFromRendered'
>;

function nextBatchOrSeparator() {
  for (; this.curIdx < this.sequence.length; this.curIdx += 1) {
    const action = this.sequence[this.curIdx];

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
        this.curIdx += 1;
        return { done: false, value: promise };
      }
    } else {
      this.curIdx += 1;
      return { done: false, value: this.createJobs(action, this.payload) };
    }
  }

  return { done: true, value: undefined };
}

export default class JobSequence<Rendered, Job>
  implements Iterable<JobOrSeparator<Job>> {
  sequence: BatchesOrSeparators;
  createJobs: CreateJobs<Rendered, Job>;
  payload: any;

  constructor(
    renderedSepuence: BatchesOrSeparators,
    payload: any,
    createJobs: CreateJobs<Rendered, Job>
  ) {
    this.sequence = renderedSepuence;
    this.payload = payload;
    this.createJobs = createJobs;
  }

  get length() {
    return this.sequence.length;
  }

  /* :: @@iterator: () => Iterator<JobOrSeparator<Job>>; */
  [Symbol.iterator]() {
    return {
      curIdx: 0,
      next: nextBatchOrSeparator,
      sequence: this.sequence,
      payload: this.payload,
      createJobs: this.createJobs,
    };
  }
}
