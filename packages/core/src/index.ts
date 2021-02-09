import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
} from './symbol';
import createMachinatElement from './createElement';
import App from './app';
import BaseBot from './base/Bot';
import BaseProfiler from './base/Profiler';
import BaseMarshaler from './base/Marshaler';
import type {
  AppConfig,
  MachinatElement,
  NativeComponent,
  ContainerComponent,
  AnyPlatformModule,
} from './types';

/**
 * @category Root
 */
namespace Machinat {
  export const createElement = createMachinatElement;
  export const createApp = <Platform extends AnyPlatformModule>(
    config: AppConfig<Platform>
  ): App<Platform> => {
    const app = new App(config);
    return app;
  };

  export const Fragment = MACHINAT_FRAGMENT_TYPE;
  export const Pause = MACHINAT_PAUSE_TYPE;
  export const Provider = MACHINAT_PROVIDER_TYPE;
  export const Thunk = MACHINAT_THUNK_TYPE;
  export const Raw = MACHINAT_RAW_TYPE;

  export const Bot = BaseBot;
  export const Profiler = BaseProfiler;
  export const Marshaler = BaseMarshaler;
}

export default Machinat;

declare global {
  namespace JSX {
    type Element = MachinatElement<any, any>;
    type ElementClass = NativeComponent<any, any> | ContainerComponent<any>;

    interface ElementAttributesProperty {
      $$typeof: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }

    type LibraryManagedAttributes<C, P> = C extends NativeComponent<
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
