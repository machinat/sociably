// @flow
import type {
  MachinatNode,
  NativeComponent,
  CreateDispatchScopeFn,
  DispatchScopeWrapper,
  ThunkEffectFn,
  MachinatChannel,
  MachinatBot,
} from '../types';
import type MachinatRenderer from '../renderer';
import type MachinatQueue from '../queue';
import type { JobBatchResponse } from '../queue/types';

import DispatchError from './error';
import type {
  MachinatWorker,
  DispatchableSegment,
  MachinatTask,
  DispatchResponse,
  DispatchFrame,
} from './types';

// MachinatEngine provide helpers to render element tree into tasks to execute,
// it pass tasks through dispatch middlewares, execute tasks and return the
// results poped through middlewares.
export default class MachinatEngine<
  Channel: MachinatChannel,
  SegmentValue,
  Native: NativeComponent<any, SegmentValue>,
  Job,
  Result
> {
  platform: string;
  bot: MachinatBot<Channel, Result, any>;

  renderer: MachinatRenderer<SegmentValue, Native>;
  queue: MachinatQueue<Job, Result>;
  worker: MachinatWorker<Job, Result>;

  _createDispatchScope: CreateDispatchScopeFn<
    Job,
    DispatchFrame<Channel, Job>,
    Result
  >;

  constructor(
    platform: string,
    bot: MachinatBot<Channel, Result, any>,
    renderer: MachinatRenderer<SegmentValue, Native>,
    queue: MachinatQueue<Job, Result>,
    worker: MachinatWorker<Job, Result>,
    dispatchWrapper: DispatchScopeWrapper<
      Job,
      DispatchFrame<Channel, Job>,
      Result
    >
  ) {
    this.platform = platform;
    this.bot = bot;
    this.renderer = renderer;
    this.worker = worker;

    this.queue = queue;
    worker.start(this.queue);

    this._createDispatchScope = dispatchWrapper(this._execute.bind(this));
  }

  // render renders machinat element tree into task to be executed. There are
  // three kinds of task: "dispatch" contains the jobs to be executed on the
  // certain platform, "pause" represent the interval made by <Pause />
  // element which should be waited between "dispatch" tasks, "thunk" holds a
  // function registered by service which will be excuted after all jobs
  // dispatched.
  async render<Target: null | Channel>(
    target: Target,
    node: MachinatNode,
    createJobs: (
      segments: DispatchableSegment<SegmentValue, Native>[],
      target: Target
    ) => Job[]
  ): Promise<null | DispatchResponse<Job, Result>> {
    const { scope, wrappedDispatcher } = await this._createDispatchScope();

    const segments = await this.renderer.render(scope, node);
    if (segments === null) {
      return null;
    }

    const tasks: MachinatTask<Job>[] = [];
    let thunks: ThunkEffectFn[] = [];
    let dispatchables: DispatchableSegment<SegmentValue, Native>[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (segment.type === 'thunk') {
        // collect thunk
        thunks.push(segment.value);
      } else if (segment.type === 'pause') {
        // create jobs from buffered segments and clear buffer
        if (dispatchables.length > 0) {
          const jobs = createJobs(dispatchables, target);
          if (jobs !== null) {
            tasks.push({ type: 'dispatch', payload: jobs });
          }
          dispatchables = [];
        }

        if (thunks.length > 0) {
          for (const thunkFn of thunks) {
            tasks.push({ type: 'thunk', payload: thunkFn });
          }
          thunks = [];
        }

        tasks.push({ type: 'pause', payload: segment.value });
      } else {
        // push unit segments to buffer
        dispatchables.push(segment);
      }
    }

    if (dispatchables.length > 0) {
      const jobs = createJobs(dispatchables, target);
      if (jobs !== null) {
        tasks.push({ type: 'dispatch', payload: jobs });
      }
    }

    for (const thunkFn of thunks) {
      tasks.push({ type: 'thunk', payload: thunkFn });
    }

    const frame: DispatchFrame<Channel, Job> = {
      platform: this.platform,
      bot: this.bot,
      channel: target,
      tasks,
      node,
    };

    return wrappedDispatcher(frame);
  }

  // dispatch construct the dispatch frame containing the tasks along with other
  // info throught dispatch middleware. At the end of the stack of middlewares,
  // all the tasks is executed and the response poped up along the retruning
  // chain of the middlewares.
  async dispatchJobs(
    channel: null | Channel,
    jobs: Job[],
    node?: MachinatNode
  ): Promise<DispatchResponse<Job, Result>> {
    const { wrappedDispatcher } = await this._createDispatchScope();

    const frame: DispatchFrame<Channel, Job> = {
      platform: this.platform,
      bot: this.bot,
      channel,
      tasks: [{ type: 'dispatch', payload: jobs }],
      node: node || null,
    };
    return wrappedDispatcher(frame);
  }

  async _execute(
    frame: DispatchFrame<Channel, Job>
  ): Promise<DispatchResponse<Job, Result>> {
    const { tasks } = frame;
    const results: Result[] = [];
    const thunks: ThunkEffectFn[] = [];
    const jobsExecuted: Job[] = [];

    for (const task of tasks) {
      if (task.type === 'dispatch') {
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
        const delayFn = task.payload;
        if (delayFn) {
          // eslint-disable-next-line no-await-in-loop
          await delayFn();
        }
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
