// @flow
/* eslint-disable no-use-before-define */
import type { InnerRenderFn, IntermediateSegment } from './renderer/types';
import type {
  Interfaceable,
  ProvisionBinding,
  ServiceContainer,
  ServiceProvider,
  ServiceInterface,
  ServiceScope,
} from './service/types';
import type { DispatchFrame, DispatchResponse } from './engine/types';
import typeof {
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_NATIVE_TYPE,
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
} from './symbol';

export type MachinatNode =
  | MachinatEmpty
  | MachinatText
  | GeneralElement
  | PauseElement
  | FragmentElement
  | ProviderElement
  | RawElement
  | ThunkElement
  | Array<MachinatNode>;

export type MachinatRenderable =
  | MachinatText
  | GeneralElement
  | PauseElement
  | ProviderElement
  | RawElement
  | ThunkElement;

export type MachinatElementType =
  | string
  | FunctionalComponent<any>
  | ContainerComponent<any>
  | NativeComponent<any, any>
  | MACHINAT_FRAGMENT_TYPE
  | MACHINAT_PAUSE_TYPE
  | MACHINAT_PROVIDER_TYPE
  | MACHINAT_THUNK_TYPE
  | MACHINAT_RAW_TYPE;

export type MachinatElement<P, T> = {|
  $$typeof: MACHINAT_ELEMENT_TYPE,
  type: T,
  props: P,
|};

export type MachinatText = string | number;
export type MachinatEmpty = null | void | boolean;

export type GeneralElement = MachinatElement<{| [string]: any |}, string>;

export type FunctionalComponent<Props> = (
  props: Props
) => MachinatNode | Promise<MachinatNode>;

export type FunctionalElement<
  Props,
  Component: FunctionalComponent<Props>
> = MachinatElement<Props, Component>;

export type ContainerComponent<Props> = ServiceContainer<
  FunctionalComponent<Props>
>;

export type ContainerElement<
  Props,
  Component: ContainerComponent<Props>
> = MachinatElement<Props, Component>;

export type NativeComponent<Props, Value> = {
  (
    element: NativeElement<Props, Value, NativeComponent<Props, Value>>,
    path: string,
    render: InnerRenderFn<Value, NativeComponent<Props, Value>>
  ):
    | null
    | IntermediateSegment<Value, NativeComponent<Props, Value>>[]
    | Promise<
        null | IntermediateSegment<Value, NativeComponent<Props, Value>>[]
      >,
  $$typeof: MACHINAT_NATIVE_TYPE,
  $$platform: string,
};

export type NativeElement<
  Props,
  Value,
  Component: NativeComponent<Props, Value>
> = MachinatElement<Props, Component>;

export type FragmentElement = MachinatElement<
  {| children: MachinatNode |},
  MACHINAT_FRAGMENT_TYPE
>;

export type ProviderElement = MachinatElement<
  {| provide: Interfaceable, value: any, children: MachinatNode |},
  MACHINAT_PROVIDER_TYPE
>;

export type PauseUntilFn = () => Promise<any>;

export type PauseElement = MachinatElement<
  {| until?: PauseUntilFn |},
  MACHINAT_PAUSE_TYPE
>;

export type ThunkEffectFn = () => Promise<any>;

export type ThunkElement = MachinatElement<
  {| effect: ThunkEffectFn |},
  MACHINAT_THUNK_TYPE
>;

export type RawElement = MachinatElement<{| value: any |}, MACHINAT_RAW_TYPE>;

export interface MachinatChannel {
  +platform: string;
  +uid: string;
}

export interface MachinatUser {
  +platform: string;
  +uid: string;
}

export interface MachinatEvent<Payload> {
  +platform: any;
  +type: any;
  +subtype?: any;
  +payload: Payload;
}

export interface MachinatMetadata<Source: string> {
  +source: Source;
}

export interface MachinatBot<Channel: MachinatChannel, Job, Result> {
  render(
    channel: Channel,
    message: MachinatNode
  ): Promise<null | DispatchResponse<Job, Result>>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type EventContext<
  Channel: MachinatChannel,
  User: ?MachinatUser,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Bot: null | MachinatBot<Channel, any, any>
> = {
  platform: string,
  channel: Channel,
  user: User,
  event: Event,
  metadata: Metadata,
  bot: Bot,
};

export type Middleware<Input, Output> = (
  input: Input,
  next: (Input) => Promise<Output>
) => Promise<Output>;

export type EventMiddleware<
  Context: EventContext<any, any, any, any, any>,
  Response
> = Middleware<Context, Response>;

export type DispatchMiddleware<
  Job,
  Frame: DispatchFrame<any, Job, any>,
  Result
> = Middleware<Frame, DispatchResponse<Job, Result>>;

export type ServiceModule = {
  provisions: (ServiceProvider<any, any> | ProvisionBinding)[],
  startHook?: null | ServiceContainer<Promise<void>>,
};

export type PlatformModule<
  Context: EventContext<any, any, any, any, any>,
  EventResp,
  Job,
  Frame: DispatchFrame<any, Job, any>,
  Result
> = {
  name: string,
  mounterInterface: ServiceInterface<
    PlatformMounter<Context, EventResp, Job, Frame, Result>,
    any
  >,
  provisions: (ServiceProvider<any, any> | ProvisionBinding)[],
  startHook?: ServiceContainer<Promise<void>>,
  eventMiddlewares?: (
    | EventMiddleware<Context, EventResp>
    | ServiceContainer<EventMiddleware<Context, EventResp>>
  )[],
  dispatchMiddlewares?: (
    | DispatchMiddleware<Job, Frame, Result>
    | ServiceContainer<DispatchMiddleware<Job, Frame, Result>>
  )[],
};

export type AppConfig<Context: EventContext<any, any, any, any, any>> = {
  platforms?: PlatformModule<Context, any, any, any, any>[],
  modules?: ServiceModule[],
  bindings?: (ServiceProvider<any, any> | ProvisionBinding)[],
};

export type InitScopeFn = () => ServiceScope;

export type PopEventFn<
  Context: EventContext<any, any, any, any, any>,
  Response
> = (context: Context, scope?: ServiceScope) => Promise<Response>;

export type PopEventWrapper<
  Context: EventContext<any, any, any, any, any>,
  Response
> = (
  finalHandler: (Context) => Promise<Response>
) => PopEventFn<Context, Response>;

export type PopErrorFn = (err: Error, scope?: ServiceScope) => void;

export type DispatchFn<Job, Frame: DispatchFrame<any, Job, any>, Result> = (
  frame: Frame,
  scope?: ServiceScope
) => Promise<DispatchResponse<Job, Result>>;

export type DispatchWrapper<
  Job,
  Frame: DispatchFrame<any, Job, any>,
  Result
> = (
  dispatch: (Frame) => Promise<DispatchResponse<Job, Result>>
) => DispatchFn<Job, Frame, Result>;

export type PlatformMounter<
  Context: EventContext<any, any, any, any, any>,
  EventResponse,
  Job,
  Frame: DispatchFrame<any, Job, any>,
  Result
> = {
  initScope: InitScopeFn,
  popError: PopErrorFn,
  popEventWrapper: PopEventWrapper<Context, EventResponse>,
  dispatchWrapper: DispatchWrapper<Job, Frame, Result>,
};
