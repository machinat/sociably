// @flow
import delay from 'delay';
import { compose } from 'machinat-utility';

import type { MachinatNode, PauseElement } from 'machinat/types';
import type MahinateQueue from 'machinat-queue';
import type { JobBatchResponse } from 'machinat-queue/types';
import type MachinatRenderer from 'machinat-renderer';
import type { MachinatNativeComponent } from 'machinat-renderer/types';

import DispatchError from './error';

import type {
  DispatchMiddleware,
  DispatchFrame,
  SegmentWithoutPause,
  MachinatThread,
  MachinatWorker,
  DispatchAction,
  DispatchResponse,
} from './types';

const handlePause = async (pauseElement: PauseElement) => {
  const { after, delay: timeToDelay } = pauseElement.props;
  let promise;

  if (timeToDelay !== undefined) {
    promise = delay(timeToDelay);
  }

  if (after !== undefined) {
    promise = promise === undefined ? after() : promise.then(after);
  }

  await promise;
};

export default class MachinatEngine<
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Thread: MachinatThread,
  Job,
  Result
> {
  platform: string;
  middlewares: DispatchMiddleware<Thread, Job, Result>[];
  renderer: MachinatRenderer<SegmentValue, Native>;
  queue: MahinateQueue<Job, Result>;
  worker: MachinatWorker<Job, Result>;
  frame: {};

  _handleSending: (
    frame: DispatchFrame<Thread, Job>
  ) => Promise<null | DispatchResponse<Job, Result>>;

  constructor(
    platform: string,
    renderer: MachinatRenderer<SegmentValue, Native>,
    queue: MahinateQueue<Job, Result>,
    worker: MachinatWorker<Job, Result>
  ) {
    this.platform = platform;
    this.renderer = renderer;
    this.queue = queue;
    this.worker = worker;

    this.middlewares = [];
    this.setMiddlewares();

    this.frame = {};

    this.worker.start(queue);
  }

  setMiddlewares(...fns: DispatchMiddleware<Thread, Job, Result>[]) {
    for (const fn of fns) {
      if (typeof fn !== 'function') {
        throw new TypeError('middleware must be a function!');
      }
    }

    this.middlewares = fns;
    this._handleSending = compose(...this.middlewares)(
      this._executeSending.bind(this)
    );

    return this;
  }

  setFramePrototype(mixin: Object) {
    this.frame = Object.defineProperties(
      {},
      Object.getOwnPropertyDescriptors(mixin)
    );

    return this;
  }

  renderActions<T, O>(
    createJobs: (
      target: T,
      segments: SegmentWithoutPause<SegmentValue, Native>[],
      options: O
    ) => Job[],
    target: T,
    message: MachinatNode,
    options: O,
    allowPause: boolean
  ): null | DispatchAction<Job>[] {
    const segments = this.renderer.render(message, allowPause);
    if (segments === null) {
      return null;
    }

    const actions: DispatchAction<Job>[] = [];

    let segmentsBuffer: SegmentWithoutPause<SegmentValue, Native>[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];

      if (segment.type !== 'pause') {
        segmentsBuffer.push(segment);
      }

      // create jobs batch when Pause met or loop end
      if (
        (i === segments.length - 1 || segment.type === 'pause') &&
        segmentsBuffer.length > 0
      ) {
        const jobs = createJobs(target, segmentsBuffer, options);

        if (jobs !== null) {
          actions.push({ type: 'jobs', payload: jobs });
        }
      }

      // collect pauses
      if (segment.type === 'pause') {
        actions.push({ type: 'pause', payload: segment.node });
        segmentsBuffer = [];
      }
    }

    return actions;
  }

  dispatch(
    thread: null | Thread,
    actions: DispatchAction<Job>[],
    node?: MachinatNode
  ): Promise<null | DispatchResponse<Job, Result>> {
    const frame: DispatchFrame<Thread, Job> = Object.create(this.frame);

    frame.thread = thread;
    frame.actions = actions;
    frame.platform = this.platform;
    frame.node = node;

    return this._handleSending(frame);
  }

  async _executeSending(
    frame: DispatchFrame<Thread, Job>
  ): Promise<null | DispatchResponse<Job, Result>> {
    const { actions } = frame;
    const results: Result[] = [];

    for (const action of actions) {
      if (action.type === 'jobs') {
        const batchResp: JobBatchResponse<
          Job,
          Result
        > = await this.queue.executeJobs(action.payload); // eslint-disable-line no-await-in-loop

        if (batchResp.success) {
          for (const jobResp of batchResp.batch) {
            results.push(jobResp.result);
          }
        } else {
          const { errors, batch } = batchResp;

          throw new DispatchError(errors, actions, [
            ...results,
            ...(batch ? batch.map(jobResp => jobResp && jobResp.result) : []),
          ]);
        }
      } else if (action.type === 'pause') {
        // eslint-disable-next-line no-await-in-loop
        await handlePause(action.payload);
      } else {
        throw new TypeError(`invalid dispatch action type "${action.type}"`);
      }
    }

    return { actions, results };
  }
}
