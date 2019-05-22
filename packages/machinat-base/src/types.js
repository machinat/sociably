// @flow
import type { MachinatNode, PauseElement } from 'machinat/types';
import type MachinatQueue from 'machinat-queue';
import type {
  TextSegment,
  UnitSegment,
  RawSegment,
  MachinatNativeComponent,
} from 'machinat-renderer/types';
import type MachinatBot from './bot';

export type { MachinatBot }; // eslint-disable-line import/prefer-default-export

export type MiddlewareFunc<Frame, Value> = (
  next: (Frame) => Value
) => Frame => Value;

export type SegmentWithoutPause<SegmentValue, Native> =
  | TextSegment<Native>
  | RawSegment<SegmentValue>
  | UnitSegment<SegmentValue, Native>;

export interface MachinatThread {
  platform: string;
  type: any;
  subtype?: any;
  uid: string;
}

export interface MachinatEvent<Payload> {
  platform: any;
  type: any;
  subtype?: any;
  payload: Payload;
}

export interface MachinatTransport<Source: string> {
  source: Source;
}

export type EventFrame<
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result,
  Thread: MachinatThread,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> = {
  platform: string,
  thread: Thread,
  event: Event,
  bot: MachinatBot<Thread, Event, SegmentValue, Native, any, Job, Result>,
  transport: Transport,
  reply(nodes: MachinatNode, options: any): Promise<null | Result[]>,
};

export type EventMiddleware<
  Native,
  Response,
  Thread: MachinatThread,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> = MiddlewareFunc<
  EventFrame<any, Native, any, any, Thread, Event, Transport>,
  Promise<void | Response>
>;

type PauseDispatchAction = {| type: 'pause', payload: PauseElement |};
type JobsDispatchAction<Job> = {| type: 'jobs', payload: Job[] |};
export type DispatchAction<Job> = PauseDispatchAction | JobsDispatchAction<Job>;

export type DispatchFrame<Thread: MachinatThread, Job> = {
  platform: string,
  thread: null | Thread,
  actions: DispatchAction<Job>[],
  bot: MachinatBot<Thread, Event, any, any, any, Job, any>,
  node?: MachinatNode,
};

export type DispatchResponse<Job, Result> = {
  actions: DispatchAction<Job>[],
  results: Result[],
};

export type DispatchMiddleware<
  Thread: MachinatThread,
  Job,
  Result
> = MiddlewareFunc<
  DispatchFrame<Thread, Job>,
  Promise<null | DispatchResponse<Job, Result>>
>;

export type BotPlugin<
  Thread,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>,
  SegmentValue,
  Native,
  Response,
  Job,
  Result
> = (
  bot: MachinatBot<
    Thread,
    Event,
    Transport,
    SegmentValue,
    Native,
    Response,
    Job,
    Result
  >
) => {
  dispatchMiddleware?: DispatchMiddleware<Thread, Job, Result>,
  dispatchFrameExtension?: {
    [string]: any,
  },
  eventMiddleware?: EventMiddleware<Native, Response, Thread, Event, Transport>,
  eventFrameExtension?: {
    [string]: any,
  },
};

export interface MachinatWorker<Job, Result> {
  start(queue: MachinatQueue<Job, Result>): boolean;
  stop(queue: MachinatQueue<Job, Result>): boolean;
}

export type EventHandler<
  Response,
  Thread: MachinatThread,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> = (
  thread: Thread,
  event: Event,
  transport: Transport
) => Promise<void | Response>;

export interface MachinatReceiver<
  Response,
  Thread: MachinatThread,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> {
  bind(
    eventHandler: EventHandler<Response, Thread, Event, Transport>,
    errorHandler: (err: Error) => void
  ): boolean;
  unbind(): boolean;
}
