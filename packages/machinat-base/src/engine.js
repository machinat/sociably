// @flow
import invariant from 'invariant';
import delay from 'delay';

import { ACTION_BREAK } from 'machinat-utility';

import type { MachinatNode, PauseElement } from 'machinat/types';
import type MahinateQueue from 'machinat-queue';
import type { JobResponse } from 'machinat-queue/types';
import type MahinateRenderer from 'machinat-renderer';
import type { MachinatNativeType, PauseAction } from 'machinat-renderer/types';
import { SendError } from './error';
import { compose } from './utils';
import type {
  DispatchReport,
  SendMiddleware,
  DispatchContext,
  ActionWithoutPause,
  MachinatWorker,
  MachinatThread,
} from './types';

const getResult = <Job, Result>(res: JobResponse<Job, Result>): Result =>
  res.result;

const flatten = <T>(metric: T[][]): T[] => {
  const flattened = [];
  for (const arr of metric) {
    flattened.push(...arr);
  }
  return flattened;
};

const handlePause = async (pauseEle: PauseElement) => {
  const { after, delay: timeToDelay } = pauseEle.props;
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
  Rendered,
  Native: MachinatNativeType<Rendered>,
  Job,
  Result,
  Thread: MachinatThread<Job, any>
> {
  platform: string;
  middlewares: SendMiddleware<Rendered, Native, Job, Result, Thread>[];
  queue: MahinateQueue<Job, Result>;
  renderer: MahinateRenderer<Rendered, Native>;
  worker: MachinatWorker;
  _handleSending: (
    DispatchContext<Rendered, Native, Job, Thread>
  ) => Promise<DispatchReport<Rendered, Native, Job, Result>>;

  constructor(
    platform: string,
    queue: MahinateQueue<Job, Result>,
    renderer: MahinateRenderer<Rendered, Native>,
    worker: MachinatWorker
  ) {
    this.platform = platform;
    this.queue = queue;
    this.renderer = renderer;
    this.worker = worker;

    this.middlewares = [];
    this.use();
  }

  use(...fns: SendMiddleware<Rendered, Native, Job, Result, Thread>[]) {
    for (const fn of fns) {
      if (typeof fn !== 'function') {
        throw new TypeError('middleware must be a function!');
      }
    }

    this.middlewares.push(...fns);
    this._handleSending = compose(...this.middlewares)(
      this._executeSending.bind(this)
    );

    return this;
  }

  start() {
    return this.worker.start(this.queue);
  }

  stop() {
    return this.worker.stop(this.queue);
  }

  async dispatch(
    thread: Thread,
    node: MachinatNode,
    options: any
  ): Promise<null | Result[]> {
    const actions = this.renderer.render(node, {
      platform: this.platform,
    });

    const context: DispatchContext<Rendered, Native, Job, Thread> = {
      element: node,
      thread,
      options,
      actions,
      platform: this.platform,
      renderer: this.renderer,
    };

    const report = await this._handleSending(context);
    return report.results;
  }

  async _executeSending(
    context: DispatchContext<Rendered, Native, Job, Thread>
  ): Promise<DispatchReport<Rendered, Native, Job, Result>> {
    const { actions, element, options, thread } = context;

    // leave the decision to thread if nothing rendered
    if (actions === null) {
      const jobs = thread.createJobs(null, options);

      let results = null;
      if (jobs !== null) {
        // if there is any jobs, execute it
        const batchResponse = await this.queue.executeJobs(jobs);

        if (batchResponse.success) {
          results = batchResponse.batch.map(getResult);
        } else {
          throw new SendError(
            batchResponse.errors,
            element,
            actions,
            jobs,
            batchResponse.batch
          );
        }
      }

      return { element, actions, jobs, results };
    }

    const jobBatches: Job[][] = [];
    const pauses: PauseAction[] = [];

    let actionBuffer: ActionWithoutPause<Rendered, Native>[] = [];

    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];

      // collect actions to buffer and ignoring ACTION_BREAK
      if (!action.isPause && action.value !== ACTION_BREAK) {
        actionBuffer.push(action);
      }

      // create and collect jobs batch when Pause met or loop end
      if (
        (i === actions.length - 1 || action.isPause) &&
        actionBuffer.length > 0
      ) {
        const jobs = thread.createJobs(actionBuffer, options);

        if (jobs !== null) {
          jobBatches.push(jobs);
        }
      }

      // collect pauses
      if (action.isPause) {
        invariant(
          thread.allowPause,
          `you shall not <Pause /> on ${thread.platform}:${thread.type}`
        );

        pauses.push(action);
        actionBuffer = [];
      }
    }

    const responses: JobResponse<Job, Result>[] = [];

    for (let i = 0; i < jobBatches.length; i += 1) {
      // execute batch of jobs
      const batchResponse = await this.queue.executeJobs(jobBatches[i]); // eslint-disable-line no-await-in-loop

      if (batchResponse.success) {
        responses.push(...batchResponse.batch);
      } else {
        throw new SendError(
          batchResponse.errors,
          element,
          actions,
          flatten(jobBatches),
          batchResponse.batch
            ? responses.concat(batchResponse.batch)
            : responses
        );
      }

      // if there is Pause between batch await it
      if (i < pauses.length) {
        await handlePause(pauses[i].element); // eslint-disable-line no-await-in-loop
      }
    }

    return {
      element,
      actions,
      jobs: flatten(jobBatches),
      results: responses.map(getResult),
    };
  }
}
