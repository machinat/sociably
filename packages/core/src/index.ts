import {
  SOCIABLY_FRAGMENT_TYPE,
  SOCIABLY_PAUSE_TYPE,
  SOCIABLY_PROVIDER_TYPE,
  SOCIABLY_THUNK_TYPE,
  SOCIABLY_RAW_TYPE,
} from './symbol.js';
import createSociablyElement from './createElement.js';
import App from './app.js';
import type {
  AppConfig,
  SociablyElement,
  NativeComponent,
  ContainerComponent,
  AnySociablyPlatform,
  FragmentProps,
  PauseProps,
  ProviderProps,
  ThunkProps,
  RawProps,
} from './types.js';

export {
  serviceContainer,
  serviceInterface,
  serviceProviderClass,
  serviceProviderFactory,
} from './service/index.js';
export { default as BaseBot } from './base/Bot.js';
export { default as BaseProfiler } from './base/Profiler.js';
export { default as StateController } from './base/StateController.js';
export { default as IntentRecognizer } from './base/IntentRecognizer.js';
export { default as Marshaler } from './base/Marshaler.js';
export { default as RenderingTarget } from './base/RenderingTarget.js';
export * from './types.js';

/**
 * @category Root
 */
namespace Sociably {
  export const createElement = createSociablyElement;
  export const createApp = <Platform extends AnySociablyPlatform>(
    config: AppConfig<Platform>
  ): App<Platform> => {
    const app = new App(config);
    return app;
  };

  export const Fragment = SOCIABLY_FRAGMENT_TYPE as unknown as (
    props: FragmentProps
  ) => null;

  export const Pause = SOCIABLY_PAUSE_TYPE as unknown as (
    props: PauseProps
  ) => null;

  export const Provider = SOCIABLY_PROVIDER_TYPE as unknown as <T>(
    props: ProviderProps<T>
  ) => null;

  export const Thunk = SOCIABLY_THUNK_TYPE as unknown as (
    props: ThunkProps
  ) => null;

  export const Raw = SOCIABLY_RAW_TYPE as unknown as (props: RawProps) => null;

  export namespace JSX {
    export type Element = SociablyElement<any, any>;
    export type ElementClass =
      | NativeComponent<any, any>
      | ContainerComponent<any>;

    export type ElementAttributesProperty = {
      $$typeof: {};
    };
    export type ElementChildrenAttribute = {
      children: {};
    };

    export type LibraryManagedAttributes<C, P> = C extends NativeComponent<
      infer T,
      any
    >
      ? T
      : C extends ContainerComponent<infer U>
      ? U
      : P;

    // interface IntrinsicElements {}
  }
}

export default Sociably;
