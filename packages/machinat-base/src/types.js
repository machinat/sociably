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
  MachinatNativeType,
} from 'machinat-renderer/types';
import type MachinatBot from './bot';

export type { MachinatBot }; // eslint-disable-line import/prefer-default-export

export type MiddlewareFunc<Frame, Value> = (
  next: (Frame) => Value
) => Frame => Value;

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

export type EventFrame<
  Rendered,
  Native: MachinatNativeType<Rendered>,
  Job,
  Result,
  Thread: MachinatThread<Job, any>,
  Event: MachinatEvent<any, Thread>
> = {
  platform: string,
  thread: Thread,
  event: Event,
  bot: MachinatBot<Rendered, Native, Job, Result, any, any, Thread, Event>,
  source: string,
  transportContext: any,
  react(nodes: MachinatNode, options: any): Promise<null | Result[]>,
};

export type EventMiddleware<
  Native,
  Response,
  Thread: MachinatThread<any, any>,
  Event: MachinatEvent<any, Thread>
> = MiddlewareFunc<
  EventFrame<any, Native, any, any, Thread, Event>,
  Promise<void | Response>
>;

export type DispatchFrame<
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
  createJobs(
    actions: null | ActionWithoutPause<any, any>[],
    options: any
  ): null | Job[],
};

export type DispatchReport<Rendered, Native, Job, Result> = {
  element: null | MachinatNode,
  actions: null | MachinatAction<Rendered, Native>[],
  jobs: null | Job[],
  results: null | Result[],
};

export type DispatchMiddleware<
  Rendered,
  Native,
  Job,
  Result,
  Thread: MachinatThread<Job, any>
> = MiddlewareFunc<
  DispatchFrame<Rendered, Native, Job, Thread>,
  Promise<DispatchReport<Rendered, Native, Job, Result>>
>;

export type BotPlugin<
  Rendered,
  Native,
  Job,
  Result,
  DeliverableThread,
  Response,
  ReceivableThread,
  Event: MachinatEvent<any, ReceivableThread>
> = (
  bot: MachinatBot<
    Rendered,
    Native,
    Job,
    Result,
    DeliverableThread,
    Response,
    ReceivableThread,
    Event
  >
) => {
  dispatchMiddleware?: DispatchMiddleware<
    Rendered,
    Native,
    Job,
    Result,
    DeliverableThread
  >,
  dispatchFrameExtension?: {
    [string]: any,
  },
  eventMiddleware?: EventMiddleware<Native, Response, ReceivableThread, Event>,
  eventFrameExtension?: {
    [string]: any,
  },
};

export interface MachinatWorker {
  start(queue: MachinatQueue<any, any>): boolean;
  stop(queue: MachinatQueue<any, any>): boolean;
}

export type EventHandler<
  Response,
  Thread: MachinatThread<any, any>,
  Event: MachinatEvent<any, Thread>
> = (
  source: string,
  event: Event,
  tranportContext: any
) => Promise<void | Response>;

export interface MachinatAdaptor<
  Response,
  Thread: MachinatThread<any, any>,
  Event: MachinatEvent<any, Thread>
> {
  bind(handler: EventHandler<Response, Thread, Event>): boolean;
  unbind(): boolean;
}
