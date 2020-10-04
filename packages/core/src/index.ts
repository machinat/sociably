/**
 * This is the doc comment for file1.ts
 * @packageDocumentation
 */
import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
} from './symbol';
import createElement from './createElement';
import App from './app';
import type {
  AppConfig,
  PlatformModule,
  MachinatElement,
  NativeComponent,
} from './types';

/**
 * @category Root
 */
const Machinat = {
  Fragment: MACHINAT_FRAGMENT_TYPE,
  Pause: MACHINAT_PAUSE_TYPE,
  Provider: MACHINAT_PROVIDER_TYPE,
  Thunk: MACHINAT_THUNK_TYPE,
  Raw: MACHINAT_RAW_TYPE,
  createElement,
  createApp<Platform extends PlatformModule<any, any, any, any, any>>(
    config: AppConfig<Platform>
  ): App<Platform> {
    const app = new App(config);
    return app;
  },
};

export default Machinat;

declare global {
  namespace JSX {
    type Element = MachinatElement<any, any>;
    type ElementClass = NativeComponent<any, any>;

    interface ElementChildrenAttribute {
      children: {};
    }

    type LibraryManagedAttributes<C, P> = C extends NativeComponent<
      infer T,
      any
    >
      ? T
      : P;

    // interface IntrinsicElements {}
  }
}
