// @flow
/* eslint-disable no-use-before-define */
import type {
  MachinatNode,
  MachinatPause,
  MachinatNativeComponent,
  RenderThunkFn,
  MachinatUser,
  MachinatChannel,
  MachinatEvent,
  MachinatMetadata,
} from 'machinat/types';
import type MachinatQueue from 'machinat-queue';
import type {
  TextSegment,
  UnitSegment,
  RawSegment,
} from 'machinat-renderer/types';

export interface MachinatBot<
  Channel: MachinatChannel,
  User: ?MachinatUser,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result,
  SendOptions,
  BotOptions: {
    plugins?: BotPlugin<
      Channel,
      User,
      Event,
      Metadata,
      Response,
      SegmentValue,
      Native,
      Job,
      Result,
      SendOptions,
      any
    >[],
  }
> {
  constructor(options: BotOptions): void;

  render(
    channel: Channel,
    message: MachinatNode,
    options: SendOptions
  ): Promise<null | Result[]>;

  onEvent(
    listener: (
      EventFrame<
        Channel,
        User,
        Event,
        Metadata,
        SegmentValue,
        Native,
        Job,
        Result,
        SendOptions
      >
    ) => void
  ): MachinatBot<
    Channel,
    User,
    Event,
    Metadata,
    Response,
    SegmentValue,
    Native,
    Job,
    Result,
    SendOptions,
    BotOptions
  >;

  removeEventListener(
    listener: (
      EventFrame<
        Channel,
        User,
        Event,
        Metadata,
        SegmentValue,
        Native,
        Job,
        Result,
        SendOptions
      >
    ) => void
  ): boolean;

  onError(
    listener: (Error) => void
  ): MachinatBot<
    Channel,
    User,
    Event,
    Metadata,
    Response,
    SegmentValue,
    Native,
    Job,
    Result,
    SendOptions,
    BotOptions
  >;

  removeErrorListener(listener: (Error) => void): boolean;

  // FIXME: type for oberservable
  // [Symbol$observable](): Obserable
}

export type MachinatMiddleware<Frame, Value> = (
  next: (Frame) => Value
) => Frame => Value;

export type OutputableSegment<SegmentValue, Native> =
  | TextSegment<Native>
  | RawSegment<SegmentValue>
  | UnitSegment<SegmentValue, Native>;

export type EventFrame<
  Channel: MachinatChannel,
  User: ?MachinatUser,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result,
  SendOptions
> = {
  platform: string,
  channel: Channel,
  user: User,
  event: Event,
  bot: MachinatBot<
    Channel,
    User,
    Event,
    Metadata,
    any,
    SegmentValue,
    Native,
    Job,
    Result,
    any,
    any
  >,
  metadata: Metadata,
  reply(nodes: MachinatNode, options: SendOptions): Promise<null | Result[]>,
};

export type EventMiddleware<
  Channel: MachinatChannel,
  User: ?MachinatUser,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response,
  Native,
  SendOptions
> = MachinatMiddleware<
  EventFrame<
    Channel,
    User,
    Event,
    Metadata,
    any,
    Native,
    any,
    any,
    SendOptions
  >,
  Promise<Response>
>;

type TransmitTask<Job> = {| type: 'transmit', payload: Job[] |};
type PauseTask = {| type: 'pause', payload: MachinatPause |};
type ThunkTask = {| type: 'thunk', payload: RenderThunkFn |};

export type DispatchTask<Job> = TransmitTask<Job> | PauseTask | ThunkTask;

export type DispatchFrame<Channel: MachinatChannel, Job> = {
  platform: string,
  channel: null | Channel,
  tasks: DispatchTask<Job>[],
  bot: MachinatBot<Channel, any, any, any, any, any, any, Job, any, any, any>,
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
> = MachinatMiddleware<
  DispatchFrame<Channel, Job>,
  Promise<DispatchResponse<Job, Result>>
>;

export type BotPlugin<
  Channel: MachinatChannel,
  User: ?MachinatUser,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result,
  SendOption,
  Bot: MachinatBot<
    Channel,
    User,
    Event,
    Metadata,
    Response,
    SegmentValue,
    Native,
    Job,
    Result,
    SendOption,
    any
  >
> = (
  bot: Bot
) => ?{|
  dispatchMiddleware?: ?DispatchMiddleware<Channel, Job, Result>,
  eventMiddleware?: ?EventMiddleware<
    Channel,
    User,
    Event,
    Metadata,
    Response,
    Native,
    SendOption
  >,
|};

export interface MachinatWorker<Job, Result> {
  start(queue: MachinatQueue<Job, Result>): boolean;
  stop(queue: MachinatQueue<Job, Result>): boolean;
}

export type EventIssuer<
  Channel: MachinatChannel,
  User: ?MachinatUser,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response
> = (
  channel: Channel,
  user: User,
  event: Event,
  metadata: Metadata
) => Promise<Response>;
