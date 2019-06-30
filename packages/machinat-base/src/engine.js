// @flow
import delay from 'delay';
import { compose } from 'machinat-utility';

import type {
  MachinatNode,
  MachinatPause,
  MachinatNativeComponent,
  RenderThunkFn,
} from 'machinat/types';
import type MahinateQueue from 'machinat-queue';
import type { JobBatchResponse } from 'machinat-queue/types';
import type MachinatRenderer from 'machinat-renderer';

import DispatchError from './error';

import type {
  MachinatBot,
  MachinatChannel,
  MachinatEvent,
  MachinatMetadata,
  SegmentWithoutPause,
  EventFrame,
  EventIssuer,
  EventMiddleware,
  DispatchTask,
  DispatchResponse,
  DispatchFrame,
  DispatchMiddleware,
} from './types';

const validateMiddlewares = (fns: Function[]) => {
  for (const fn of fns) {
    if (typeof fn !== 'function') {
      throw new TypeError(`middleware must be a function, got ${fn}`);
    }
  }
};

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

// MachinatEngine controls all the logic flow and the data framing within
// machinat framework. When event flow in, engine construct EventFrame and pass
// it throught event middlewares then publish it. It also provide helpers to
// render element tree into tasks to execute, pass tasks through dispatch
// middlewares, execute tasks and return results back through middlewares.
// Both event and dispatch middlewares in machinat take the in & out model
// like koa does.
export default class MachinatEngine<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result
> {
  platform: string;
  bot: MachinatBot<
    Channel,
    Event,
    Metadata,
    Response,
    SegmentValue,
    Native,
    Job,
    Result
  >;

  renderer: MachinatRenderer<SegmentValue, Native>;
  queue: MahinateQueue<Job, Result>;

  eventMiddlewares: EventMiddleware<
    Channel,
    Event,
    Metadata,
    Response,
    Native
  >[];
  dispatchMiddlewares: DispatchMiddleware<Channel, Job, Result>[];

  _dispatchThroughMiddlewares: (
    frame: DispatchFrame<Channel, Job>
  ) => Promise<null | DispatchResponse<Job, Result>>;

  constructor(
    platform: string,
    bot: MachinatBot<
      Channel,
      Event,
      Metadata,
      Response,
      SegmentValue,
      Native,
      Job,
      Result
    >,
    renderer: MachinatRenderer<SegmentValue, Native>,
    queue: MahinateQueue<Job, Result>,
    eventMiddlewares: EventMiddleware<
      Channel,
      Event,
      Metadata,
      Response,
      Native
    >[],
    dispatchMiddlewares: DispatchMiddleware<Channel, Job, Result>[]
  ) {
    this.platform = platform;
    this.bot = bot;
    this.renderer = renderer;
    this.queue = queue;

    validateMiddlewares(eventMiddlewares);
    validateMiddlewares(dispatchMiddlewares);

    this.eventMiddlewares = eventMiddlewares;
    this.dispatchMiddlewares = dispatchMiddlewares;
    this._dispatchThroughMiddlewares = compose(...this.dispatchMiddlewares)(
      this._executeDispatch.bind(this)
    );
  }

  // eventIssuer create the event issuing function which construct event frame
  // and pass it through event middlewares in order. The finalHandler is called
  // as the last middleware then return the response poped out of the stack one
  // be one. For most of time you pass the issuer fn created to the receiver.
  eventIssuer(
    finalHandler: (
      EventFrame<Channel, Event, Metadata, any, any, any, any>
    ) => Promise<void | Response>
  ): EventIssuer<Channel, Event, Metadata, Response> {
    const issue = compose(...this.eventMiddlewares)(finalHandler);

    return (channel: Channel, event: Event, metadata: Metadata) => {
      const { bot } = this;

      const frame = {
        platform: this.platform,
        bot,
        channel,
        event,
        metadata,
        reply(nodes: MachinatNode, options: any) {
          return bot.send(channel, nodes, options);
        },
      };

      return issue(frame);
    };
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
      segments: SegmentWithoutPause<SegmentValue, Native>[],
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
    let segmentsBuffer: SegmentWithoutPause<SegmentValue, Native>[] = [];

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
  ): Promise<null | DispatchResponse<Job, Result>> {
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
  ): Promise<null | DispatchResponse<Job, Result>> {
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
