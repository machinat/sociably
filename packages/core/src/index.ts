import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
} from './symbol';
import createElement from './createElement';
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
const Machinat = {
  createElement,
  createApp<Platform extends AnyPlatformModule>(
    config: AppConfig<Platform>
  ): App<Platform> {
    const app = new App(config);
    return app;
  },

  Fragment: MACHINAT_FRAGMENT_TYPE,
  Pause: MACHINAT_PAUSE_TYPE,
  Provider: MACHINAT_PROVIDER_TYPE,
  Thunk: MACHINAT_THUNK_TYPE,
  Raw: MACHINAT_RAW_TYPE,

  Bot: BaseBot,
  Profiler: BaseProfiler,
  Marshaler: BaseMarshaler,
};

export default Machinat;

declare global {
  namespace JSX {
    type Element = MachinatElement<unknown, unknown>;
    type ElementClass =
      | NativeComponent<unknown, any>
      | ContainerComponent<unknown>;

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
