import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
} from './symbol';
import createMachinatElement from './createElement';
import App from './app';
import type {
  AppConfig,
  MachinatElement,
  NativeComponent,
  ContainerComponent,
  AnyMachinatPlatform,
  FragmentProps,
  PauseProps,
  ProviderProps,
  ThunkProps,
  RawProps,
} from './types';

export {
  makeContainer,
  makeInterface,
  makeClassProvider,
  makeFactoryProvider,
} from './service';
export { default as BasicBot } from './base/Bot';
export { default as BasicProfiler } from './base/Profiler';
export { default as StateController } from './base/StateController';
export { default as IntentRecognizer } from './base/IntentRecognizer';
export { default as Marshaler } from './base/Marshaler';
export * from './types';

/**
 * @category Root
 */
namespace Machinat {
  export const createElement = createMachinatElement;
  export const createApp = <Platform extends AnyMachinatPlatform>(
    config: AppConfig<Platform>
  ): App<Platform> => {
    const app = new App(config);
    return app;
  };

  export const Fragment = MACHINAT_FRAGMENT_TYPE as unknown as (
    props: FragmentProps
  ) => null;

  export const Pause = MACHINAT_PAUSE_TYPE as unknown as (
    props: PauseProps
  ) => null;

  export const Provider = MACHINAT_PROVIDER_TYPE as unknown as (
    props: ProviderProps
  ) => null;

  export const Thunk = MACHINAT_THUNK_TYPE as unknown as (
    props: ThunkProps
  ) => null;

  export const Raw = MACHINAT_RAW_TYPE as unknown as (props: RawProps) => null;

  export namespace JSX {
    export type Element = MachinatElement<any, any>;
    export type ElementClass =
      | NativeComponent<any, any>
      | ContainerComponent<any>;

    export interface ElementAttributesProperty {
      $$typeof: {};
    }
    export interface ElementChildrenAttribute {
      children: {};
    }

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

export default Machinat;
