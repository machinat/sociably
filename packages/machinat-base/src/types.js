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

export interface MachinatChannel {
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
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> = {
  platform: string,
  channel: Channel,
  event: Event,
  bot: MachinatBot<Channel, Event, SegmentValue, Native, any, Job, Result>,
  transport: Transport,
  reply(nodes: MachinatNode, options: any): Promise<null | Result[]>,
};

export type EventMiddleware<
  Native,
  Response,
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> = MiddlewareFunc<
  EventFrame<any, Native, any, any, Channel, Event, Transport>,
  Promise<void | Response>
>;

type PauseDispatchTask = {| type: 'pause', payload: PauseElement |};
type TransmitDispatchTask<Job> = {| type: 'transmit', payload: Job[] |};
export type DispatchTask<Job> = PauseDispatchTask | TransmitDispatchTask<Job>;

export type DispatchFrame<Channel: MachinatChannel, Job> = {
  platform: string,
  channel: null | Channel,
  tasks: DispatchTask<Job>[],
  bot: MachinatBot<Channel, Event, any, any, any, Job, any>,
  node?: MachinatNode,
};

export type DispatchResponse<Job, Result> = {
  jobs: Job[],
  tasks: DispatchTask<Job>[],
  results: Result[],
};

export type DispatchMiddleware<
  Channel: MachinatChannel,
  Job,
  Result
> = MiddlewareFunc<
  DispatchFrame<Channel, Job>,
  Promise<null | DispatchResponse<Job, Result>>
>;

export type BotPlugin<
  Channel,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>,
  SegmentValue,
  Native,
  Response,
  Job,
  Result
> = (
  bot: MachinatBot<
    Channel,
    Event,
    Transport,
    SegmentValue,
    Native,
    Response,
    Job,
    Result
  >
) => {
  dispatchMiddleware?: DispatchMiddleware<Channel, Job, Result>,
  dispatchFrameExtension?: {
    [string]: any,
  },
  eventMiddleware?: EventMiddleware<
    Native,
    Response,
    Channel,
    Event,
    Transport
  >,
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
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> = (
  channel: Channel,
  event: Event,
  transport: Transport
) => Promise<void | Response>;

export interface MachinatReceiver<
  Response,
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Transport: MachinatTransport<any>
> {
  bind(
    eventHandler: EventHandler<Response, Channel, Event, Transport>,
    errorHandler: (err: Error) => void
  ): boolean;
  unbind(): boolean;
}
