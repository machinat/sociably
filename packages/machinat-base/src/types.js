// @flow
import type { MachinatNode, PauseElement } from 'machinat/types';
import type MachinatQueue from 'machinat-queue';
import type {
  TextSegment,
  ElementSegment,
  RawSegment,
  MachinatNativeType,
} from 'machinat-renderer/types';
import type MachinatBot from './bot';

export type { MachinatBot }; // eslint-disable-line import/prefer-default-export

export type MiddlewareFunc<Frame, Value> = (
  next: (Frame) => Value
) => Frame => Value;

export type SegmentWithoutPause<SegmentValue, Native> =
  | TextSegment
  | RawSegment<SegmentValue>
  | ElementSegment<SegmentValue, Native>;

export interface MachinatThread {
  platform: string;
  type: any;
  subtype?: any;
  uid: string;
}

export interface MachinatEvent<Payload, Thread: MachinatThread> {
  platform: any;
  type: any;
  subtype?: any;
  thread: Thread;
  shouldRespond: boolean;
  payload: Payload;
}

export type EventFrame<
  SegmentValue,
  Native: MachinatNativeType<SegmentValue>,
  Job,
  Result,
  Thread: MachinatThread,
  Event: MachinatEvent<any, Thread>
> = {
  platform: string,
  thread: Thread,
  event: Event,
  bot: MachinatBot<Thread, Event, SegmentValue, Native, any, Job, Result>,
  source: string,
  transportation: any,
  reply(nodes: MachinatNode, options: any): Promise<null | Result[]>,
};

export type EventMiddleware<
  Native,
  Response,
  Thread: MachinatThread,
  Event: MachinatEvent<any, Thread>
> = MiddlewareFunc<
  EventFrame<any, Native, any, any, Thread, Event>,
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
  Event: MachinatEvent<any, Thread>,
  SegmentValue,
  Native,
  Response,
  Job,
  Result
> = (
  bot: MachinatBot<Thread, Event, SegmentValue, Native, Response, Job, Result>
) => {
  dispatchMiddleware?: DispatchMiddleware<Thread, Job, Result>,
  dispatchFrameExtension?: {
    [string]: any,
  },
  eventMiddleware?: EventMiddleware<Native, Response, Thread, Event>,
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
  Event: MachinatEvent<any, Thread>
> = (
  source: string,
  event: Event,
  tranportContext: any
) => Promise<void | Response>;

export interface MachinatReceiver<
  Response,
  Thread: MachinatThread,
  Event: MachinatEvent<any, Thread>
> {
  bind(
    eventHandler: EventHandler<Response, Thread, Event>,
    errorHandler: (err: Error) => void
  ): boolean;
  unbind(): boolean;
}
