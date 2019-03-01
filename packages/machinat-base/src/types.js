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
  uid(): string;
  // TODO: put createJobs method under a symbol
  createJobs(actions: ActionWithoutPause<any, any>[], options: Options): Job[];
}

declare function getOptions<Options, Thread: MachinatThread<any, Options>>(
  Thread
): Options;
export type OptionsOf<Thread: MachinatThread<any, any>> = $Call<
  typeof getOptions,
  Thread
>;

export interface MachinatEvent<Raw, Thread: MachinatThread<any, any>> {
  platform: any;
  type: any;
  subtype?: any;
  thread: Thread;
  shouldRespond: boolean;
  raw: Raw;
}

export type SendResponse<Rendered, Native, Job, Result> = {
  jobs: ?(Job[]),
  results: ?(Result[]),
  actions: ?(MachinatAction<Rendered, Native>[]),
  message: MachinatNode,
};

export type SendContext<
  Rendered,
  Native,
  Job,
  Thread: MachinatThread<Job, any>
> = {
  message: MachinatNode,
  platform: string,
  thread: Thread,
  options: OptionsOf<Thread>,
  renderer: MahinateRenderer<Rendered, Native>,
  actions: MachinatAction<Rendered, Native>[],
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
  SendContext<Rendered, Native, Job, Thread>,
  Promise<SendResponse<Rendered, Native, Job, Result>>
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
