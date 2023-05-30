import RenderingTargetI from '../base/RenderingTarget.js';
import SociablyQueue, { JobBatchResponse } from '../queue/index.js';
import { createEmptyScope, ServiceScope } from '../service/index.js';
import type SociablyRenderer from '../renderer/index.js';
import type {
  SociablyNode,
  NativeComponent,
  InitScopeFn,
  DispatchWrapper,
  ThunkEffectFn,
  DispatchTarget,
} from '../types.js';
import DispatchError from './error.js';
import {
  SociablyWorker,
  DispatchableSegment,
  SociablyTask,
  DispatchResponse,
  DispatchFrame,
} from './types.js';

/**
 * SociablyEngine provide helpers to render element tree into tasks to execute,
 * it pass tasks through dispatch middlewares, execute tasks and return the
 * results poped through middlewares.
 */
export default class SociablyEngine<
  Target extends DispatchTarget,
  SegmentValue,
  Component extends NativeComponent<unknown, any>,
  Job,
  Result
> {
  platform: string;
  renderer: SociablyRenderer<SegmentValue, Component>;
  queue: SociablyQueue<Job, Result>;
  worker: SociablyWorker<Job, Result>;

  private _initScope: InitScopeFn;
  private _dispatcher: (
    frame: DispatchFrame<null | Target, Job>,
    scope: ServiceScope
  ) => Promise<DispatchResponse<Job, Result>>;

  constructor(
    platform: string,
    renderer: SociablyRenderer<SegmentValue, Component>,
    queue: SociablyQueue<Job, Result>,
    worker: SociablyWorker<Job, Result>,
    initScope: InitScopeFn = () => createEmptyScope(),
    dispatchWrapper: DispatchWrapper<
      Job,
      DispatchFrame<null | Target, Job>,
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
   * renders sociably element tree into tasks to be executed. There are
   * three kinds of task: "dispatch" contains the jobs to be executed on the
   * certain platform, "pause" represent the interval made by <Pause />
   * element which should be waited between "dispatch" tasks, "thunk" holds a
   * function registered by service which will be excuted after all jobs
   * dispatched.
   */
  async render<T extends Target>(
    target: T,
    node: SociablyNode,
    createJobs: (
      target: T,
      segments: DispatchableSegment<SegmentValue>[]
    ) => Job[]
  ): Promise<null | DispatchResponse<Job, Result>> {
    const scope = this._initScope();
    const segments = await this.renderer.render(node, scope, [
      [RenderingTargetI, target],
    ]);
    if (segments === null) {
      return null;
    }

    const tasks: SociablyTask<Job>[] = [];
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

    const frame: DispatchFrame<T, Job> = {
      platform: this.platform,
      target,
      tasks,
      node,
    };

    return this._dispatcher(frame, scope);
  }

  /**
   * dispatch jobs directly without rendering procedures.
   */
  async dispatchJobs(
    target: null | Target,
    jobs: Job[]
  ): Promise<DispatchResponse<Job, Result>> {
    const frame: DispatchFrame<null | Target, Job> = {
      platform: this.platform,
      target,
      tasks: [{ type: 'dispatch', payload: jobs }],
      node: null,
    };

    return this._dispatcher(frame, this._initScope());
  }

  async _execute(
    frame: DispatchFrame<Target, Job>
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
