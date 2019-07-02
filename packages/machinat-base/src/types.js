// @flow
import type {
  MachinatNode,
  MachinatPause,
  MachinatNativeComponent,
  RenderThunkFn,
} from 'machinat/types';
import type MachinatQueue from 'machinat-queue';
import type {
  TextSegment,
  UnitSegment,
  RawSegment,
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

export interface MachinatMetadata<Source: string> {
  source: Source;
}

export type EventFrame<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result
> = {
  platform: string,
  channel: Channel,
  event: Event,
  bot: MachinatBot<
    Channel,
    Event,
    Metadata,
    any,
    SegmentValue,
    Native,
    Job,
    Result
  >,
  metadata: Metadata,
  reply(nodes: MachinatNode, options: any): Promise<null | Result[]>,
};

export type EventMiddleware<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response,
  Native
> = MiddlewareFunc<
  EventFrame<Channel, Event, Metadata, any, Native, any, any>,
  Promise<void | Response>
>;

type TransmitTask<Job> = {| type: 'transmit', payload: Job[] |};
type PauseTask = {| type: 'pause', payload: MachinatPause |};
type ThunkTask = {| type: 'thunk', payload: RenderThunkFn |};

export type DispatchTask<Job> = TransmitTask<Job> | PauseTask | ThunkTask;

export type DispatchFrame<Channel: MachinatChannel, Job> = {
  platform: string,
  channel: null | Channel,
  tasks: DispatchTask<Job>[],
  bot: MachinatBot<Channel, any, any, any, any, any, Job, any>,
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
  Metadata: MachinatMetadata<any>,
  Response,
  SegmentValue,
  Native,
  Job,
  Result
> = (
  bot: MachinatBot<
    Channel,
    Event,
    Metadata,
    Response,
    SegmentValue,
    Native,
    Job,
    Result
  >
) => {
  dispatchMiddleware?: DispatchMiddleware<Channel, Job, Result>,
  eventMiddleware?: EventMiddleware<Channel, Event, Metadata, Response, Native>,
};

export interface MachinatWorker<Job, Result> {
  start(queue: MachinatQueue<Job, Result>): boolean;
  stop(queue: MachinatQueue<Job, Result>): boolean;
}

export type EventIssuer<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response
> = (
  channel: Channel,
  event: Event,
  metadata: Metadata
) => Promise<void | Response>;
