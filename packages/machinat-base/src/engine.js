// @flow
import delay from 'delay';
import { compose } from 'machinat-utility';

import type {
  MachinatNode,
  MachinatPause,
  MachinatNativeComponent,
  RenderThunkFn,
  MachinatChannel,
} from 'machinat/types';
import type MahinateQueue from 'machinat-queue';
import type { JobBatchResponse } from 'machinat-queue/types';
import type MachinatRenderer from 'machinat-renderer';

import DispatchError from './error';
import { validateMiddlewares } from './utils';
import type {
  MachinatBot,
  MachinatWorker,
  OutputableSegment,
  DispatchTask,
  DispatchResponse,
  DispatchFrame,
  DispatchMiddleware,
} from './types';

const handlePause = async (pauseElement: MachinatPause) => {
  const { until, delay: timeToDelay } = pauseElement.props;
  let promise;

  if (timeToDelay !== undefined) {
    promise = delay(timeToDelay);
  }

  if (until !== undefined) {
    promise = promise === undefined ? until() : promise.then(until);
  }

  await promise;
};

// MachinatEngine provide helpers to render element tree into tasks to execute,
// it pass tasks through dispatch middlewares, execute tasks and return the
// results poped through middlewares.
export default class MachinatEngine<
  Channel: MachinatChannel,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result
> {
  platform: string;
  bot: MachinatBot<
    Channel,
    any,
    any,
    any,
    any,
    SegmentValue,
    Native,
    Job,
    Result,
    any,
    any
  >;

  renderer: MachinatRenderer<SegmentValue, Native>;
  queue: MahinateQueue<Job, Result>;
  worker: MachinatWorker<Job, Result>;
  dispatchMiddlewares: DispatchMiddleware<Channel, Job, Result>[];

  _dispatchThroughMiddlewares: (
    frame: DispatchFrame<Channel, Job>
  ) => Promise<DispatchResponse<Job, Result>>;

  constructor(
    platform: string,
    bot: MachinatBot<
      Channel,
      any,
      any,
      any,
      any,
      SegmentValue,
      Native,
      Job,
      Result,
      any,
      any
    >,
    renderer: MachinatRenderer<SegmentValue, Native>,
    queue: MahinateQueue<Job, Result>,
    worker: MachinatWorker<Job, Result>,
    dispatchMiddlewares: DispatchMiddleware<Channel, Job, Result>[]
  ) {
    this.platform = platform;
    this.bot = bot;
    this.renderer = renderer;
    this.queue = queue;
    this.worker = worker;

    worker.start(queue);

    validateMiddlewares(dispatchMiddlewares);

    this.dispatchMiddlewares = dispatchMiddlewares;
    this._dispatchThroughMiddlewares = compose(...this.dispatchMiddlewares)(
      this._executeDispatch.bind(this)
    );
  }

  // renderTasks renders machinat element tree into task to be executed. There
  // are three kinds of task: "transmit" contains the jobs to be executed on the
  // certain platform, "pause" represent the interval made by <Pause />
  // element which should be waited between "transmit" tasks, "thunk" holds a
  // function registered by service which will be excuted after all jobs
  // transmited.
  async renderTasks<T, O>(
    createJobs: (
      target: T,
      segments: OutputableSegment<SegmentValue, Native>[],
      options: O
    ) => Job[],
    target: T,
    message: MachinatNode,
    options: O,
    allowPause: boolean
  ): Promise<null | DispatchTask<Job>[]> {
    const segments = await this.renderer.render(message, allowPause);
    if (segments === null) {
      return null;
    }

    const tasks: DispatchTask<Job>[] = [];
    let thunksBuffer: RenderThunkFn[] = [];
    let segmentsBuffer: OutputableSegment<SegmentValue, Native>[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (segment.type === 'thunk') {
        // collect thunk
        thunksBuffer.push(segment.value);
      } else if (segment.type === 'pause') {
        // create jobs from buffered segments and clear buffer
        if (segmentsBuffer.length > 0) {
          const jobs = createJobs(target, segmentsBuffer, options);
          if (jobs !== null) {
            tasks.push({ type: 'transmit', payload: jobs });
          }
          segmentsBuffer = [];
        }

        if (thunksBuffer.length > 0) {
          for (const thunkFn of thunksBuffer) {
            tasks.push({ type: 'thunk', payload: thunkFn });
          }
          thunksBuffer = [];
        }

        tasks.push({ type: 'pause', payload: segment.node });
      } else {
        // push unit segments to buffer
        segmentsBuffer.push(segment);
      }
    }

    if (segmentsBuffer.length > 0) {
      const jobs = createJobs(target, segmentsBuffer, options);
      if (jobs !== null) {
        tasks.push({ type: 'transmit', payload: jobs });
      }
    }

    for (const thunkFn of thunksBuffer) {
      tasks.push({ type: 'thunk', payload: thunkFn });
    }

    return tasks;
  }

  // dispatch construct the dispatch frame containing the tasks along with other
  // info throught dispatch middleware. At the end of the stack of middlewares,
  // all the tasks is executed and the response poped up along the retruning
  // chain of the middlewares.
  dispatch(
    channel: null | Channel,
    tasks: DispatchTask<Job>[],
    node?: MachinatNode
  ): Promise<DispatchResponse<Job, Result>> {
    return this._dispatchThroughMiddlewares({
      platform: this.platform,
      bot: this.bot,
      channel,
      tasks,
      node,
    });
  }

  async _executeDispatch(
    frame: DispatchFrame<Channel, Job>
  ): Promise<DispatchResponse<Job, Result>> {
    const { tasks } = frame;
    const results: Result[] = [];
    const thunks: RenderThunkFn[] = [];
    const jobsExecuted: Job[] = [];

    for (const task of tasks) {
      if (task.type === 'transmit') {
        jobsExecuted.push(...task.payload);

        const batchResp: JobBatchResponse<
          Job,
          Result
        > = await this.queue.executeJobs(task.payload); // eslint-disable-line no-await-in-loop

        if (batchResp.success) {
          for (const jobResp of batchResp.batch) {
            results.push(jobResp.result);
          }
        } else {
          const { errors, batch } = batchResp;

          throw new DispatchError(errors, tasks, jobsExecuted, [
            ...results,
            ...(batch ? batch.map(jobResp => jobResp && jobResp.result) : []),
          ]);
        }
      } else if (task.type === 'pause') {
        // eslint-disable-next-line no-await-in-loop
        await handlePause(task.payload);
      } else if (task.type === 'thunk') {
        thunks.push(task.payload);
      } else {
        throw new TypeError(`invalid dispatch task type "${task.type}"`);
      }
    }

    if (thunks.length > 0) {
      const errors: Error[] = [];

      await Promise.all(
        thunks.map(async thunk => {
          try {
            await thunk();
          } catch (err) {
            errors.push(err);
          }
        })
      );

      if (errors.length > 0) {
        throw new DispatchError(errors, tasks, jobsExecuted, results);
      }
    }

    return { tasks, results, jobs: jobsExecuted };
  }
}
