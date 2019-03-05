// @flow
import type { IncomingMessage, ServerResponse } from 'http';
import type { MachinatNode } from 'machinat/types';
import type MahinateRenderer from 'machinat-renderer';
import type MachinatQueue from 'machinat-queue';
import type {
  TextRenderedAction,
  ElementRenderedAction,
  RawAction,
  MachinatAction,
} from 'machinat-renderer/types';
import type BaseBot from './bot';
import type ReceiveContext from './context';

export type ActionWithoutPause<Rendered, Native> =
  | TextRenderedAction
  | ElementRenderedAction<Rendered, Native>
  | RawAction;

export interface MachinatThread<Job, Options> {
  platform: string;
  type: any;
  subtype?: any;
  allowPause: boolean;
  uid: string;
  // TODO: move "createJobs" method under a symbol
  createJobs(
    actions: null | ActionWithoutPause<any, any>[],
    options: Options
  ): null | Job[];
}

export interface MachinatEvent<Raw, Thread: MachinatThread<any, any>> {
  platform: any;
  type: any;
  subtype?: any;
  thread: Thread;
  shouldRespond: boolean;
  raw: Raw;
}

export type DispatchReport<Rendered, Native, Job, Result> = {
  element: null | MachinatNode,
  actions: null | MachinatAction<Rendered, Native>[],
  jobs: null | Job[],
  results: null | Result[],
};

export type DispatchContext<
  Rendered,
  Native,
  Job,
  Thread: MachinatThread<Job, any>
> = {
  element: MachinatNode,
  platform: string,
  thread: Thread,
  options: any,
  renderer: MahinateRenderer<Rendered, Native>,
  actions: null | MachinatAction<Rendered, Native>[],
};

export type MiddlewareFunc<Ctx, Value> = (
  next: (ctx: Ctx) => Value
) => (ctx: Ctx) => Value;

export type ReceiveMiddleware<
  Raw,
  Response,
  Native,
  Thread: MachinatThread<any, any>
> = MiddlewareFunc<
  ReceiveContext<Raw, any, Native, any, any, Thread>,
  Promise<void | Response>
>;

export type SendMiddleware<
  Rendered,
  Native,
  Job,
  Result,
  Thread: MachinatThread<Job, any>
> = MiddlewareFunc<
  DispatchContext<Rendered, Native, Job, Thread>,
  Promise<DispatchReport<Rendered, Native, Job, Result>>
>;

export type BotPlugin<
  Raw,
  Response,
  Rendered,
  Native,
  Job,
  Result,
  DeliverableThread,
  ReceivableThread
> = (
  bot: BaseBot<
    Raw,
    Response,
    Rendered,
    Native,
    Job,
    Result,
    DeliverableThread,
    ReceivableThread
  >
) => {
  sendMiddleware: ?SendMiddleware<
    Rendered,
    Native,
    Job,
    Result,
    DeliverableThread
  >,
  receiveMiddleware: ?ReceiveMiddleware<
    Raw,
    Response,
    Native,
    ReceivableThread
  >,
};

export interface MachinatWorker {
  start(queue: MachinatQueue<any, any>): boolean;
  stop(queue: MachinatQueue<any, any>): boolean;
}

export type EventHandler<Raw, Response, Thread: MachinatThread<any, any>> = (
  event: MachinatEvent<Raw, Thread>,
  source: string,
  tranportContext: any
) => Promise<void | Response>;

export interface HTTPReceiver {
  handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    rawBody?: string,
    httpContext?: any
  ): void | Promise<void>;
}

export interface HTTPReceivable {
  receiver: HTTPReceiver;
}
