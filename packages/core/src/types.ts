/* eslint-disable @typescript-eslint/no-use-before-define */
import type { InnerRenderFn, IntermediateSegment } from './renderer/types.js';
import type {
  Interfaceable,
  ServiceProvision,
  ServiceContainer,
  ServiceInterface,
  ServiceScope,
  MaybeContainer,
} from './service/index.js';
import type { DispatchResponse, AnyDispatchFrame } from './engine/types.js';
import type {
  SOCIABLY_ELEMENT_TYPE,
  SOCIABLY_NATIVE_TYPE,
  SOCIABLY_FRAGMENT_TYPE,
  SOCIABLY_PAUSE_TYPE,
  SOCIABLY_PROVIDER_TYPE,
  SOCIABLY_THUNK_TYPE,
  SOCIABLY_RAW_TYPE,
} from './symbol.js';

export type { default as SociablyApp } from './app.js';
export type { SociablyProfile } from './base/Profiler.js';

export type SociablyRenderable =
  | SociablyText
  | GeneralElement
  | NativeElement<unknown, AnyNativeComponent>
  | PauseElement
  | ProviderElement<unknown>
  | RawElement
  | ThunkElement
  | FunctionalElement<unknown, FunctionalComponent<unknown>>
  | ContainerElement<unknown, ContainerComponent<unknown>>;

export type SociablyNode =
  | SociablyEmpty
  | SociablyRenderable
  | ThunkElement
  | SociablyNode[];

export type SociablyElementType =
  | string
  | FunctionalComponent<unknown>
  | ContainerComponent<unknown>
  | NativeComponent<unknown, IntermediateSegment<unknown>>
  | typeof SOCIABLY_FRAGMENT_TYPE
  | typeof SOCIABLY_PAUSE_TYPE
  | typeof SOCIABLY_PROVIDER_TYPE
  | typeof SOCIABLY_THUNK_TYPE
  | typeof SOCIABLY_RAW_TYPE;

export type SociablyElement<P, T> = {
  $$typeof: typeof SOCIABLY_ELEMENT_TYPE;
  type: T;
  props: P;
};

export type SociablyText = string | number;
export type SociablyEmpty = null | undefined | boolean;

export type GeneralElement = SociablyElement<Record<string, unknown>, string>;

type RenderEnv = {
  path: string;
  platform: string;
};

export type FunctionalComponent<Props> = (
  props: Props,
  circs: RenderEnv
) => SociablyElement<unknown, unknown>;

export type FunctionalElement<
  Props,
  Component extends FunctionalComponent<Props>
> = SociablyElement<Props, Component>;

type ContainerComponentFn<Props> = (
  props: Props,
  circs: RenderEnv
) => SociablyNode | Promise<SociablyNode>;

export type ContainerComponent<Props> = ServiceContainer<
  ContainerComponentFn<Props>,
  unknown[]
>;

export type ContainerElement<
  Props,
  Component extends ContainerComponent<Props>
> = SociablyElement<Props, Component>;

export type NativeComponentFn<
  Props,
  Segment extends IntermediateSegment<unknown>
> = (
  element: NativeElement<Props, NativeComponent<Props, Segment>>,
  path: string,
  render: InnerRenderFn
) => null | Segment[] | Promise<null | Segment[]>;

export type NativeComponent<
  Props,
  Segment extends IntermediateSegment<unknown>
> = {
  $$platform: string;
  $$name: string;
  $$typeof: typeof SOCIABLY_NATIVE_TYPE;
  $$render: NativeComponentFn<Props, Segment>;
  // HACK: make ts accept it as class component
  new (): NativeComponent<Props, Segment>; // eslint-disable-line @typescript-eslint/no-misused-new
};

export type AnyNativeComponent = NativeComponent<
  unknown,
  IntermediateSegment<unknown>
>;

export type NativeElement<
  Props,
  Component extends NativeComponent<Props, IntermediateSegment<unknown>>
> = SociablyElement<Props, Component>;

export type FragmentProps = {
  children: SociablyNode;
};
export type FragmentElement = SociablyElement<
  FragmentProps,
  typeof SOCIABLY_FRAGMENT_TYPE
>;

export type ProviderProps<T> = {
  provide: Interfaceable<T>;
  value: T;
  children: SociablyNode;
};

export type ProviderElement<T> = SociablyElement<
  ProviderProps<T>,
  typeof SOCIABLY_PROVIDER_TYPE
>;

export type PauseDelayFn = () => Promise<unknown>;
export type PauseProps = {
  time?: number;
  delay?: PauseDelayFn;
};
export type PauseElement = SociablyElement<
  PauseProps,
  typeof SOCIABLY_PAUSE_TYPE
>;

export type ThunkEffectFn = () => unknown | Promise<unknown>;
export type ThunkProps = {
  effect: ThunkEffectFn;
};
export type ThunkElement = SociablyElement<
  ThunkProps,
  typeof SOCIABLY_THUNK_TYPE
>;

export type RawProps = {
  value: unknown;
};
export type RawElement = SociablyElement<RawProps, typeof SOCIABLY_RAW_TYPE>;

export type UniqueOmniIdentifier = {
  readonly platform: string;
  readonly scopeId?: string | number;
  readonly id: string | number;
};

/**
 * A channel represents an instance that user can communicate with.
 * It could be a phone number, an email address, an account on social
 * media, etc. depending on which commnication platform.
 */
export type SociablyChannel = {
  readonly $$typeofChannel: true;
  readonly platform: string;
  /**
   * A set of attributes to identify the channel. All the attributes
   * together can be used as an unique key of the channel
   */
  readonly uniqueIdentifier: UniqueOmniIdentifier;
  /**
   * The unique string id of the channel. It's promised to be unique
   * while using Sociably
   */
  readonly uid: string;
};

/**
 * A thread represents a conversation between two or more users.
 * It's where a communication event happened in Sociably.
 */
export type SociablyThread = {
  readonly $$typeofThread: true;
  readonly platform: string;
  /**
   * A set of attributes to identify the thread. All the attributes
   * together can be used as an unique key of the thread
   */
  readonly uniqueIdentifier: UniqueOmniIdentifier;
  /**
   * The unique string id of the thread. It's promised to be unique
   * while using Sociably
   */
  readonly uid: string;
};

/**
 * An user who communicates through a social platform.
 */
export type SociablyUser = {
  readonly $$typeofUser: true;
  readonly platform: string;
  /**
   * A set of attributes to identify the user. All the attributes
   * together can be used as an unique key of the user
   */
  readonly uniqueIdentifier: UniqueOmniIdentifier;
  /**
   * The unique string id of the user. It's promised to be unique
   * while using Sociably
   */
  readonly uid: string;
};

export type SociablyEvent<Payload> = {
  readonly platform: string;
  readonly category: string;
  readonly type: string;
  readonly payload: Payload;
  readonly thread: null | SociablyThread;
  readonly user: null | SociablyUser;
  readonly channel: null | SociablyChannel;
};

export type TextMessageMixin = {
  readonly category: 'message';
  readonly type: 'text';
  readonly text: string;
};

export type MediaMessageMixin = {
  readonly category: 'message';
  readonly type: 'image' | 'video' | 'audio' | 'file';
  readonly url?: string;
};

export type LocationMessageMixin = {
  readonly category: 'message';
  readonly type: 'location';
  readonly latitude: number;
  readonly longitude: number;
};

export type PostbackMixin = {
  readonly category: 'postback';
  readonly type: string;
  readonly data: string;
};

export type SociablyMetadata = {
  source: string;
};

export type SociablyBot<Target extends DispatchTarget, Job, Result> = {
  render(
    target: Target,
    message: SociablyNode
  ): Promise<null | DispatchResponse<Job, Result>>;
};

export type AnySociablyBot = SociablyBot<DispatchTarget, unknown, unknown>;

export type EventContext<
  Event extends SociablyEvent<unknown>,
  Metadata extends SociablyMetadata,
  Bot extends SociablyBot<SociablyThread, unknown, unknown>
> = {
  platform: string;
  event: Event;
  metadata: Metadata;
  bot: Bot;
  reply(message: SociablyNode): ReturnType<Bot['render']>;
};

export type AnyEventContext = EventContext<
  SociablyEvent<unknown>,
  SociablyMetadata,
  SociablyBot<DispatchTarget, unknown, unknown>
>;

export type Middleware<Input, Output> = (
  input: Input,
  next: (input: Input) => Promise<Output>
) => Promise<Output>;

export type EventMiddleware<
  Context extends AnyEventContext,
  Response
> = Middleware<Context, Response>;

export type DispatchMiddleware<
  Job,
  Frame extends AnyDispatchFrame,
  Result
> = Middleware<Frame, DispatchResponse<Job, Result>>;

export type ServiceModule = {
  provisions: ServiceProvision<unknown>[];
  startHook?: null | ServiceContainer<Promise<void>, unknown[]>;
  stopHook?: null | ServiceContainer<Promise<void>, unknown[]>;
};

export type SociablyPlatform<
  Context extends AnyEventContext,
  EventResp,
  Job,
  Frame extends AnyDispatchFrame,
  Result
> = {
  name: string;
  utilitiesInterface: ServiceInterface<
    PlatformUtilities<Context, EventResp, Job, Frame, Result>
  >;
  provisions: ServiceProvision<unknown>[];
  startHook?: ServiceContainer<Promise<void>, unknown[]>;
  stopHook?: null | ServiceContainer<Promise<void>, unknown[]>;
  eventMiddlewares?: MaybeContainer<EventMiddleware<Context, EventResp>>[];
  dispatchMiddlewares?: MaybeContainer<
    DispatchMiddleware<Job, Frame, Result>
  >[];
};

export type AnySociablyPlatform = SociablyPlatform<
  AnyEventContext,
  unknown,
  unknown,
  AnyDispatchFrame,
  unknown
>;

export type AppConfig<Platform extends AnySociablyPlatform> = {
  platforms?: Platform[];
  modules?: ServiceModule[];
  services?: ServiceProvision<unknown>[];
};

export type EventContextOfPlatform<Platform extends AnySociablyPlatform> =
  Platform extends SociablyPlatform<
    infer Context,
    unknown,
    unknown,
    AnyDispatchFrame,
    unknown
  >
    ? Context
    : never;

export type InitScopeFn = () => ServiceScope;

export type PopEventFn<Context extends AnyEventContext, Response> = (
  context: Context,
  scope?: ServiceScope
) => Promise<Response>;

export type PopEventWrapper<Context extends AnyEventContext, Response> = (
  finalHandler: (ctx: Context) => Promise<Response>
) => PopEventFn<Context, Response>;

export type PopErrorFn = (err: Error, scope?: ServiceScope) => void;

export type DispatchTarget = SociablyChannel | SociablyThread;

export type DispatchFn<Job, Frame extends AnyDispatchFrame, Result> = (
  frame: Frame,
  scope?: ServiceScope
) => Promise<DispatchResponse<Job, Result>>;

export type DispatchWrapper<Job, Frame extends AnyDispatchFrame, Result> = (
  dispatch: (frame: Frame) => Promise<DispatchResponse<Job, Result>>
) => DispatchFn<Job, Frame, Result>;

export type ModuleUtilities = {
  initScope: InitScopeFn;
  popError: PopErrorFn;
};

export type PlatformUtilities<
  Context extends AnyEventContext,
  EventResponse,
  Job,
  Frame extends AnyDispatchFrame,
  Result
> = {
  popEventWrapper: PopEventWrapper<Context, EventResponse>;
  dispatchWrapper: DispatchWrapper<Job, Frame, Result>;
};

export type AgentSettingsAccessor<Agent extends SociablyChannel, Settings> = {
  getAgentSettings(agent: Agent): Promise<null | Settings>;
  getAgentSettingsBatch(agents: Agent[]): Promise<(null | Settings)[]>;
};
