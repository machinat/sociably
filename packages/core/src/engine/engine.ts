import type {
  MachinatNode,
  NativeComponent,
  InitScopeFn,
  DispatchWrapper,
  ThunkEffectFn,
  MachinatChannel,
} from '../types';
import MachinatQueue, { JobBatchResponse } from '../queue';
import { createEmptyScope } from '../service';
import type MachinatRenderer from '../renderer';
import type { ServiceScope } from '../service';

import DispatchError from './error';
import {
  MachinatWorker,
  DispatchableSegment,
  MachinatTask,
  DispatchResponse,
  DispatchFrame,
} from './types';

/**
 * MachinatEngine provide helpers to render element tree into tasks to execute,
 * it pass tasks through dispatch middlewares, execute tasks and return the
 * results poped through middlewares.
 */
export default class MachinatEngine<
  Channel extends MachinatChannel,
  SegmentValue,
  Component extends NativeComponent<unknown, any>,
  Job,
  Result
> {
  platform: string;
  renderer: MachinatRenderer<SegmentValue, Component>;
  queue: MachinatQueue<Job, Result>;
  worker: MachinatWorker<Job, Result>;

  private _initScope: InitScopeFn;
  private _dispatcher: (
    frame: DispatchFrame<Channel, Job>,
    scope: ServiceScope
  ) => Promise<DispatchResponse<Job, Result>>;

  constructor(
    platform: string,
    renderer: MachinatRenderer<SegmentValue, Component>,
    queue: MachinatQueue<Job, Result>,
    worker: MachinatWorker<Job, Result>,
    initScope: InitScopeFn = () => createEmptyScope(),
    dispatchWrapper: DispatchWrapper<
      Job,
      DispatchFrame<Channel, Job>,
      Result
    > = (dispatch) => dispatch
  ) {
    this.platform = platform;
    this.renderer = renderer;
    this.worker = worker;
    this.queue = queue;

    this._initScope = initScope;
    this._dispatcher = dispatchWrapper(this._execute.bind(this));
  }

  start(): void {
    this.worker.start(this.queue);
  }

  stop(): void {
    this.worker.stop(this.queue);
  }

  /**
   * render renders machinat element tree into task to be executed. There are
   * three kinds of task: "dispatch" contains the jobs to be executed on the
   * certain platform, "pause" represent the interval made by <Pause />
   * element which should be waited between "dispatch" tasks, "thunk" holds a
   * function registered by service which will be excuted after all jobs
   * dispatched.
   */
  async render<Target extends null | Channel>(
    target: Target,
    node: MachinatNode,
    createJobs: (
      target: Target,
      segments: DispatchableSegment<SegmentValue>[]
    ) => Job[]
  ): Promise<null | DispatchResponse<Job, Result>> {
    const scope = this._initScope();

    const segments = await this.renderer.render(node, scope);
    if (segments === null) {
      return null;
    }

    const tasks: MachinatTask<Job>[] = [];
    let thunks: ThunkEffectFn[] = [];
    let dispatchables: DispatchableSegment<SegmentValue>[] = [];

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (segment.type === 'thunk') {
        // collect thunk
        thunks.push(segment.value);
      } else if (segment.type === 'pause') {
        // create jobs from buffered segments and clear buffer
        if (dispatchables.length > 0) {
          const jobs = createJobs(target, dispatchables);
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
      const jobs = createJobs(target, dispatchables);
      if (jobs !== null) {
        tasks.push({ type: 'dispatch', payload: jobs });
      }
    }

    for (const thunkFn of thunks) {
      tasks.push({ type: 'thunk', payload: thunkFn });
    }

    const frame: DispatchFrame<Channel, Job> = {
      platform: this.platform,
      channel: target,
      tasks,
      node,
    };

    return this._dispatcher(frame, scope);
  }

  /**
   * dispatch construct the dispatch frame containing the tasks along with other
   * info throught dispatch middleware. At the end of the stack of middlewares,
   * all the tasks is executed and the response poped up along the retruning
   * chain of the middlewares.
   */
  async dispatchJobs(
    channel: null | Channel,
    jobs: Job[]
  ): Promise<DispatchResponse<Job, Result>> {
    const frame: DispatchFrame<Channel, Job> = {
      platform: this.platform,
      channel,
      tasks: [{ type: 'dispatch', payload: jobs }],
      node: null,
    };

    return this._dispatcher(frame, this._initScope());
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

        const batchResp: JobBatchResponse<Job, Result> =
          await this.queue.executeJobs(task.payload); // eslint-disable-line no-await-in-loop

        if (batchResp.success) {
          for (const jobResp of batchResp.batch) {
            results.push(jobResp.result);
          }
        } else {
          const { errors, batch } = batchResp;

          throw new DispatchError(errors, tasks, jobsExecuted, [
            ...results,
            ...(batch ? batch.map((jobResp) => jobResp && jobResp.result) : []),
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
        throw new TypeError(`unknown task met`);
      }
    }

    if (thunks.length > 0) {
      const errors: Error[] = [];

      await Promise.all(
        thunks.map(async (thunk) => {
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
