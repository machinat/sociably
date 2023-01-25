/* eslint-disable @typescript-eslint/no-use-before-define */
import type { InnerRenderFn, IntermediateSegment } from './renderer/types';
import type {
  Interfaceable,
  ServiceProvision,
  ServiceContainer,
  ServiceInterface,
  ServiceScope,
  MaybeContainer,
} from './service';
import type { DispatchFrame, DispatchResponse } from './engine/types';
import type {
  SOCIABLY_ELEMENT_TYPE,
  SOCIABLY_NATIVE_TYPE,
  SOCIABLY_FRAGMENT_TYPE,
  SOCIABLY_PAUSE_TYPE,
  SOCIABLY_PROVIDER_TYPE,
  SOCIABLY_THUNK_TYPE,
  SOCIABLY_RAW_TYPE,
} from './symbol';

export type { default as SociablyApp } from './app';
export type { SociablyProfile } from './base/Profiler';

export type SociablyRenderable =
  | SociablyText
  | GeneralElement
  | PauseElement
  | ProviderElement<unknown>
  | RawElement
  | ThunkElement
  | FunctionalElement<unknown, any>
  | ContainerElement<unknown, any>;

export type SociablyNode =
  | SociablyEmpty
  | SociablyRenderable
  | ThunkElement
  | Array<SociablyNode>;

export type SociablyElementType =
  | string
  | FunctionalComponent<unknown>
  | ContainerComponent<unknown>
  | NativeComponent<unknown, any>
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

export type GeneralElement = SociablyElement<{ [key: string]: any }, string>;

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

export type NativeComponent<
  Props,
  Segment extends IntermediateSegment<unknown>
> = {
  (
    element: NativeElement<Props, NativeComponent<Props, Segment>>,
    path: string,
    render: InnerRenderFn
  ): null | Segment[] | Promise<null | Segment[]>;
  $$typeof: typeof SOCIABLY_NATIVE_TYPE;
  $$platform: string;
  // HACK: make ts accept it as class component
  new (): NativeComponent<Props, Segment>;
};

export type NativeElement<
  Props,
  Component extends NativeComponent<Props, any>
> = SociablyElement<Props, Component>;

export type FragmentProps = { children: SociablyNode };
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
export type PauseProps = { time?: number; delay?: PauseDelayFn };
export type PauseElement = SociablyElement<
  PauseProps,
  typeof SOCIABLY_PAUSE_TYPE
>;

export type ThunkEffectFn = () => unknown | Promise<unknown>;
export type ThunkProps = { effect: ThunkEffectFn };
export type ThunkElement = SociablyElement<
  ThunkProps,
  typeof SOCIABLY_THUNK_TYPE
>;

export type RawProps = { value: unknown };
export type RawElement = SociablyElement<RawProps, typeof SOCIABLY_RAW_TYPE>;

export interface SociablyChannel {
  readonly platform: string;
  readonly uid: string;
}

export interface SociablyUser {
  readonly platform: string;
  readonly uid: string;
}

export interface SociablyEvent<Payload> {
  readonly platform: string;
  readonly category: string;
  readonly type: string;
  readonly payload: Payload;
  readonly channel: null | SociablyChannel;
  readonly user: null | SociablyUser;
}

export interface TextMessageMixin {
  readonly category: 'message';
  readonly type: 'text';
  readonly text: string;
}

export interface MediaMessageMixin {
  readonly category: 'message';
  readonly type: 'image' | 'video' | 'audio' | 'file';
  readonly url?: string;
}

export interface LocationMessageMixin {
  readonly category: 'message';
  readonly type: 'location';
  readonly latitude: number;
  readonly longitude: number;
}

export interface PostbackMixin {
  readonly category: 'postback';
  readonly type: string;
  readonly data: string;
}

export interface SociablyMetadata {
  source: string;
}

export interface SociablyBot<Channel extends SociablyChannel, Job, Result> {
  render(
    channel: Channel,
    message: SociablyNode
  ): Promise<null | DispatchResponse<Job, Result>>;
}

export type EventContext<
  Event extends SociablyEvent<unknown>,
  Metadata extends SociablyMetadata,
  Bot extends SociablyBot<SociablyChannel, unknown, unknown>
> = {
  platform: string;
  event: Event;
  metadata: Metadata;
  bot: Bot;
  reply(message: SociablyNode): ReturnType<Bot['render']>;
};

export type AnyEventContext = EventContext<any, any, any>;

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
  Frame extends DispatchFrame<SociablyChannel, Job>,
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
  Frame extends DispatchFrame<SociablyChannel, Job>,
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
  any,
  unknown,
  unknown,
  any,
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
    any,
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

export type DispatchFn<
  Job,
  Frame extends DispatchFrame<SociablyChannel, Job>,
  Result
> = (
  frame: Frame,
  scope?: ServiceScope
) => Promise<DispatchResponse<Job, Result>>;

export type DispatchWrapper<
  Job,
  Frame extends DispatchFrame<SociablyChannel, Job>,
  Result
> = (
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
  Frame extends DispatchFrame<SociablyChannel, Job>,
  Result
> = {
  popEventWrapper: PopEventWrapper<Context, EventResponse>;
  dispatchWrapper: DispatchWrapper<Job, Frame, Result>;
};
