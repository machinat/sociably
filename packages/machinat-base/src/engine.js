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
  SendResponse,
  SendMiddleware,
  SendContext,
  ActionWithoutPause,
  MachinatWorker,
  MachinatThread,
  OptionsOf,
} from './types';

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
    SendContext<Rendered, Native, Job, Thread>
  ) => Promise<SendResponse<Rendered, Native, Job, Result>>;

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

  async process(
    thread: Thread,
    node: MachinatNode,
    options: OptionsOf<Thread>
  ): Promise<SendResponse<Rendered, Native, Job, Result>> {
    const actions = this.renderer.render(node, {
      platform: this.platform,
    });

    if (!actions) {
      return { jobs: null, results: null, message: node, actions };
    }

    const context: SendContext<Rendered, Native, Job, Thread> = {
      message: node,
      thread,
      options,
      actions,
      platform: this.platform,
      renderer: this.renderer,
    };

    const sendingRespons = await this._handleSending(context);
    return sendingRespons;
  }

  async _executeSending(
    context: SendContext<Rendered, Native, Job, Thread>
  ): Promise<SendResponse<Rendered, Native, Job, Result>> {
    const { actions, message, options, thread } = context;

    const jobBatches: Job[][] = [];
    const pauses: PauseAction[] = [];

    let actionBuffer: ActionWithoutPause<Rendered, Native>[] = [];

    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];

      // collect action to buffer and ignoring ACTION_BREAK
      if (!action.isPause && action.value !== ACTION_BREAK) {
        actionBuffer.push(action);
      }

      // create and collect jobs batch when Pause met or loop end
      if (
        (i === actions.length - 1 || action.isPause) &&
        actionBuffer.length > 0
      ) {
        const jobs = thread.createJobs(actionBuffer, options);

        jobBatches.push(jobs);
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
          message,
          actions,
          jobBatches.reduce((jobs, batch) => jobs.concat(batch)),
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

    // get jobs and results
    const responsesLen = responses.length;
    const jobs: Job[] = new Array(responsesLen);
    const results: Result[] = new Array(responsesLen);

    for (let i = 0; i < responsesLen; i += 1) {
      const { job, result } = responses[i];
      jobs[i] = job;
      results[i] = result;
    }

    return {
      jobs,
      results,
      actions,
      message,
    };
  }
}
