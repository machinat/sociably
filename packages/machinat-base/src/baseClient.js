// @flow
import compose from 'koa-compose';
import invariant from 'invariant';
import delay from 'delay';

import type { MachinatNode, SeparatorElement } from 'types/element';
import type MahinateQueue from 'machinat-queue';
import type { SuccessJobResponse } from 'machinat-queue/types';
import type MahinateRenderer from 'machinat-renderer';
import type { RootAction, InnerAction } from 'machinat-renderer/types';
import { SendError } from './error';
import type { SendResponse } from './types';

type SendingContext<Action, Native, Thread, Options> = {
  message: MachinatNode,
  platform: string,
  thread: Thread,
  options: Options,
  renderer: MahinateRenderer<Action, Native>,
  actions: RootAction<Action, Native>[],
};

type MiddlewareFunc<Action, Native, Job, Result, Thread, Options> = (
  ctx: SendingContext<Action, Native, Thread, Options>,
  next?: MiddlewareFunc<Action, Native, Job, Result, Thread, Options>
) => Promise<SendResponse<Action, Native, Job, Result>>;

type CreateJobFunc<Action, Native, Job, Thread, Options> = (
  actions: InnerAction<Action, Native>[],
  thread: Thread,
  options: Options
) => Array<Job>;

const handleSeparator = async (separatorEle: SeparatorElement) => {
  const { after, delay: timeToDelay } = separatorEle.props;
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

  await promise;
};

const getJob = <J, R>(response: SuccessJobResponse<J, R>): J => response.job;
const getResult = <J, R>(response: SuccessJobResponse<J, R>): R =>
  response.result;

export default class BaseClient<Action, Native, Job, Result, Thread, Options> {
  platform: string;
  middlewares: MiddlewareFunc<Action, Native, Job, Result, Thread, Options>[];
  _queue: MahinateQueue<Job, Result>;
  _renderer: MahinateRenderer<Action, Native>;
  _handle: MiddlewareFunc<Action, Native, Job, Result, Thread, Options>;
  _createJobs: CreateJobFunc<Action, Native, Job, Thread, Options>;

  constructor(
    platform: string,
    queue: MahinateQueue<Job, Result>,
    renderer: MahinateRenderer<Action, Native>,
    createJobs: CreateJobFunc<Action, Native, Job, Thread, Options>
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
    options: Options
  ): Promise<SendResponse<Action, Native, Job, Result>> {
    const actions = this._renderer.renderRoot(node, {
      platform: this.platform,
    });

    if (!actions) {
      return { jobs: null, results: null, message: node, actions };
    }

    const context: SendingContext<Action, Native, Thread, Options> = {
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
    context: SendingContext<Action, Native, Thread, Options>
  ): Promise<SendResponse<Action, Native, Job, Result>> => {
    const { actions, message, options, thread } = context;

    const jobResponses: SuccessJobResponse<Job, Result>[] = [];

    let actionBatch: InnerAction<Action, Native>[] = [];

    for (let i = 0; i <= actions.length; i += 1) {
      const action = actions[i];

      if (action === undefined || action.isSeparator) {
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

        if (action) {
          await handleSeparator(action.element); // eslint-disable-line no-await-in-loop
          actionBatch = [];
        }
      } else {
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

  use(fn: MiddlewareFunc<Action, Native, Job, Result, Thread, Options>) {
    if (typeof fn !== 'function')
      throw new TypeError('middleware must be a function!');

    this.middlewares.push(fn);
    this._handle = compose(this.middlewares);
    return this;
  }
}
