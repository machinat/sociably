// @flow
import compose from 'koa-compose';
import invariant from 'invariant';
import delay from 'delay';

import { ACTION_BREAK } from 'machinat-utility';

import type { MachinatNode, PauseElement } from 'machinat/types';
import type MahinateQueue from 'machinat-queue';
import type { SuccessJobResponse } from 'machinat-queue/types';
import type MahinateRenderer from 'machinat-renderer';
import type {
  TextRenderedAction,
  ElementRenderedAction,
  RawAction,
  MachinatAction,
  MachinatNativeType,
} from 'machinat-renderer/types';
import { SendError } from './error';
import type { SendResponse } from './types';

type SendingContext<Rendered, Native, Thread, Options> = {
  message: MachinatNode,
  platform: string,
  thread: Thread,
  options?: Options,
  renderer: MahinateRenderer<Rendered, Native>,
  actions: MachinatAction<Rendered, Native>[],
};

type MiddlewareFunc<Rendered, Native, Job, Result, Thread, Options> = (
  ctx: SendingContext<Rendered, Native, Thread, Options>,
  next?: MiddlewareFunc<Rendered, Native, Job, Result, Thread, Options>
) => Promise<SendResponse<Rendered, Native, Job, Result>>;

type ActionWithoutPause<Rendered, Native> =
  | TextRenderedAction
  | ElementRenderedAction<Rendered, Native>
  | RawAction;

type CreateJobFunc<Rendered, Native, Job, Thread, Options> = (
  actions: ActionWithoutPause<Rendered, Native>[],
  thread: Thread,
  options?: Options
) => Job[];

const handlePause = async (pauseEle: PauseElement) => {
  const { after, delay: timeToDelay } = pauseEle.props;
  let promise;

  if (timeToDelay !== undefined) {
    promise = delay(timeToDelay);
  }

  if (after !== undefined) {
    invariant(
      typeof after === 'function',
      `"after" prop of Pause element should be a function, got ${after}`
    );

    promise = promise === undefined ? after() : promise.then(after);
  }

  await promise;
};

const getJob = <J, R>(response: SuccessJobResponse<J, R>): J => response.job;
const getResult = <J, R>(response: SuccessJobResponse<J, R>): R =>
  response.result;

export default class BaseClient<
  Rendered,
  Native: MachinatNativeType<Rendered>,
  Job,
  Result,
  Thread,
  Options
> {
  platform: string;
  middlewares: MiddlewareFunc<Rendered, Native, Job, Result, Thread, Options>[];
  _queue: MahinateQueue<Job, Result>;
  _renderer: MahinateRenderer<Rendered, Native>;
  _handle: MiddlewareFunc<Rendered, Native, Job, Result, Thread, Options>;
  _createJobs: CreateJobFunc<Rendered, Native, Job, Thread, Options>;

  constructor(
    platform: string,
    queue: MahinateQueue<Job, Result>,
    renderer: MahinateRenderer<Rendered, Native>,
    createJobs: CreateJobFunc<Rendered, Native, Job, Thread, Options>
  ) {
    this.platform = platform;
    this._queue = queue;
    this._renderer = renderer;
    this._createJobs = createJobs;

    this.middlewares = [];
    this._handle = compose(this.middlewares);
  }

  async _sendImpl(
    thread: Thread,
    node: MachinatNode,
    options?: Options
  ): Promise<SendResponse<Rendered, Native, Job, Result>> {
    const actions = this._renderer.render(node, {
      platform: this.platform,
    });

    if (!actions) {
      return { jobs: null, results: null, message: node, actions };
    }

    const context: SendingContext<Rendered, Native, Thread, Options> = {
      message: node,
      thread,
      options,
      actions,
      platform: this.platform,
      renderer: this._renderer,
    };

    const sendingRespons = await this._handle(context, this._executeSending);

    return sendingRespons;
  }

  _executeSending = async (
    context: SendingContext<Rendered, Native, Thread, Options>
  ): Promise<SendResponse<Rendered, Native, Job, Result>> => {
    const { actions, message, options, thread } = context;

    const jobResponses: SuccessJobResponse<Job, Result>[] = [];

    let actionBatch: ActionWithoutPause<Rendered, Native>[] = [];

    for (let i = 0; i <= actions.length; i += 1) {
      const action = actions[i];

      if (action === undefined || action.isPause) {
        if (actionBatch.length > 0) {
          const jobs = this._createJobs(actionBatch, thread, options);

          const batchRes = await this._queue.executeJobs(...jobs); // eslint-disable-line no-await-in-loop

          if (batchRes.success) {
            jobResponses.push(...batchRes.batch);
          } else {
            throw new SendError({
              success: false,
              errors: batchRes.errors,
              batch: batchRes.batch
                ? jobResponses.concat(batchRes.batch)
                : // NOTE: subtype[] is incompatible with supertype[], check https://github.com/facebook/flow/issues/1644#issuecomment-207929428
                  //       but it's ok since jobResponses lives only here
                  (jobResponses: any),
            });
          }
        }

        if (action !== undefined) {
          await handlePause(action.element); // eslint-disable-line no-await-in-loop
          actionBatch = [];
        }
      } else if (action.value !== ACTION_BREAK) {
        actionBatch.push(action);
      }
    }

    return {
      jobs: jobResponses.map(getJob),
      results: jobResponses.map(getResult),
      actions,
      message,
    };
  };

  use(fn: MiddlewareFunc<Rendered, Native, Job, Result, Thread, Options>) {
    if (typeof fn !== 'function')
      throw new TypeError('middleware must be a function!');

    this.middlewares.push(fn);
    this._handle = compose(this.middlewares);
    return this;
  }
}
