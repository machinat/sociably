/* eslint-disable no-use-before-define */
import type { InnerRenderFn, IntermediateSegment } from './renderer/types';
import type {
  Interfaceable,
  ServiceProvision,
  ServiceContainer,
  ServiceProvider,
  ServiceInterface,
  ServiceScope,
} from './service/types';
import type { DispatchFrame, DispatchResponse } from './engine/types';
import type {
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_NATIVE_TYPE,
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
} from './symbol';

export type MachinatRenderable =
  | MachinatText
  | GeneralElement
  | PauseElement
  | ProviderElement
  | RawElement
  | ThunkElement
  | FunctionalElement<any, any>
  | ContainerElement<any, any>;

export type MachinatNode =
  | MachinatEmpty
  | MachinatRenderable
  | ThunkElement
  | Array<MachinatNode>;

export type MachinatElementType =
  | string
  | FunctionalComponent<any>
  | ContainerComponent<any>
  | NativeComponent<any, any>
  | typeof MACHINAT_FRAGMENT_TYPE
  | typeof MACHINAT_PAUSE_TYPE
  | typeof MACHINAT_PROVIDER_TYPE
  | typeof MACHINAT_THUNK_TYPE
  | typeof MACHINAT_RAW_TYPE;

export type MachinatElement<P, T> = {
  $$typeof: typeof MACHINAT_ELEMENT_TYPE;
  type: T;
  props: P;
};

export type MachinatText = string | number;
export type MachinatEmpty = null | undefined | boolean;

export type GeneralElement = MachinatElement<{ [key: string]: any }, string>;

type RenderCircumstances = {
  platform: string;
};

export type FunctionalComponent<Props> = (
  props: Props,
  circumstances: RenderCircumstances
) => MachinatNode | Promise<MachinatNode>;

export type FunctionalElement<
  Props,
  Component extends FunctionalComponent<Props>
> = MachinatElement<Props, Component>;

export type ContainerComponent<Props> = ServiceContainer<
  FunctionalComponent<Props>
>;

export type ContainerElement<
  Props,
  Component extends ContainerComponent<Props>
> = MachinatElement<Props, Component>;

export type NativeComponent<Props, Segment extends IntermediateSegment<any>> = {
  (
    element: NativeElement<Props, NativeComponent<Props, Segment>>,
    path: string,
    render: InnerRenderFn<any>
  ): null | Segment[] | Promise<null | Segment[]>;
  $$typeof: typeof MACHINAT_NATIVE_TYPE;
  $$platform: string;
  // HACK: make ts compiler accept it as class component
  new (): NativeComponent<any, any>;
};

export type NativeElement<
  Props,
  Component extends NativeComponent<Props, any>
> = MachinatElement<Props, Component>;

export type FragmentElement = MachinatElement<
  { children: MachinatNode },
  typeof MACHINAT_FRAGMENT_TYPE
>;

export type ProviderElement = MachinatElement<
  { provide: Interfaceable<unknown>; value: unknown; children: MachinatNode },
  typeof MACHINAT_PROVIDER_TYPE
>;

export type PauseUntilFn = () => Promise<unknown>;

export type PauseElement = MachinatElement<
  { until?: PauseUntilFn },
  typeof MACHINAT_PAUSE_TYPE
>;

export type ThunkEffectFn = () => Promise<any>;

export type ThunkElement = MachinatElement<
  { effect: ThunkEffectFn },
  typeof MACHINAT_THUNK_TYPE
>;

export type RawElement = MachinatElement<
  { value: any },
  typeof MACHINAT_RAW_TYPE
>;

export interface MachinatChannel {
  readonly platform: string;
  readonly uid: string;
}

export interface MachinatUser {
  readonly platform: string;
  readonly uid: string;
}

export interface MachinatEvent<Payload> {
  readonly platform: string;
  readonly kind: string;
  readonly type: string;
  readonly payload: Payload;
  readonly channel: null | MachinatChannel;
  readonly user: null | MachinatUser;
}

export interface TextMessageMixin {
  readonly kind: 'message';
  readonly type: 'text';
  readonly text: string;
}

export interface MediaMessageMixin {
  readonly kind: 'message';
  readonly type: 'image' | 'video' | 'audio' | 'file';
  readonly url?: string;
}

export interface LocationMessageMixin {
  readonly kind: 'message';
  readonly type: 'location';
  readonly latitude: number;
  readonly longitude: number;
}

export interface PostbackMixin {
  readonly kind: 'postback';
  readonly type: any;
  readonly data: string;
}

export interface MachinatMetadata<Source extends string> {
  readonly source: Source;
}

export interface MachinatBot<Channel extends MachinatChannel, Job, Result> {
  render(
    channel: Channel,
    message: MachinatNode
  ): Promise<null | DispatchResponse<Job, Result>>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type EventContext<
  Event extends MachinatEvent<any>,
  Metadata extends MachinatMetadata<any>,
  Bot extends null | MachinatBot<any, any, any>
> = {
  platform: string;
  event: Event;
  metadata: Metadata;
  bot: Bot;
};

export type Middleware<Input, Output> = (
  input: Input,
  next: (input: Input) => Promise<Output>
) => Promise<Output>;

export type EventMiddleware<
  Context extends EventContext<any, any, any>,
  Response
> = Middleware<Context, Response>;

export type DispatchMiddleware<
  Job,
  Frame extends DispatchFrame<any, Job, any>,
  Result
> = Middleware<Frame, DispatchResponse<Job, Result>>;

export type ServiceModule = {
  provisions: (ServiceProvider<unknown> | ServiceProvision<unknown>)[];
  startHook?: null | ServiceContainer<Promise<void>>;
};

export type PlatformModule<
  Context extends EventContext<any, any, any>,
  EventResp,
  Job,
  Frame extends DispatchFrame<any, Job, any>,
  Result
> = {
  name: string;
  mounterInterface: ServiceInterface<
    PlatformMounter<Context, EventResp, Job, Frame, Result>
  >;
  provisions: (ServiceProvider<unknown> | ServiceProvision<unknown>)[];
  startHook?: ServiceContainer<Promise<void>>;
  eventMiddlewares?: (
    | EventMiddleware<Context, EventResp>
    | ServiceContainer<EventMiddleware<Context, EventResp>>
  )[];
  dispatchMiddlewares?: (
    | DispatchMiddleware<Job, Frame, Result>
    | ServiceContainer<DispatchMiddleware<Job, Frame, Result>>
  )[];
};

export type AppConfig<
  Platform extends PlatformModule<any, any, any, any, any>
> = {
  platforms?: Platform[];
  modules?: ServiceModule[];
  bindings?: (ServiceProvider<unknown> | ServiceProvision<unknown>)[];
};

export type GetAppContext<
  Platform extends PlatformModule<any, any, any, any, any>
> = Platform extends PlatformModule<infer Context, any, any, any, any>
  ? Context
  : never;

export type InitScopeFn = () => ServiceScope;

export type PopEventFn<
  Context extends EventContext<any, any, any>,
  Response
> = (context: Context, scope?: ServiceScope) => Promise<Response>;

export type PopEventWrapper<
  Context extends EventContext<any, any, any>,
  Response
> = (
  finalHandler: (ctx: Context) => Promise<Response>
) => PopEventFn<Context, Response>;

export type PopErrorFn = (err: Error, scope?: ServiceScope) => void;

export type DispatchFn<
  Job,
  Frame extends DispatchFrame<any, Job, any>,
  Result
> = (
  frame: Frame,
  scope?: ServiceScope
) => Promise<DispatchResponse<Job, Result>>;

export type DispatchWrapper<
  Job,
  Frame extends DispatchFrame<any, Job, any>,
  Result
> = (
  dispatch: (frame: Frame) => Promise<DispatchResponse<Job, Result>>
) => DispatchFn<Job, Frame, Result>;

export type PlatformMounter<
  Context extends EventContext<any, any, any>,
  EventResponse,
  Job,
  Frame extends DispatchFrame<any, Job, any>,
  Result
> = {
  initScope: InitScopeFn;
  popError: PopErrorFn;
  popEventWrapper: PopEventWrapper<Context, EventResponse>;
  dispatchWrapper: DispatchWrapper<Job, Frame, Result>;
};
