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
import type { AppConfig, EventContext } from './types';

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
  createApp<Context extends EventContext<any, any, any, any, any>>(
    config: AppConfig<Context>
  ) {
    const app = new App<Context>(config);
    return app;
  },
};

export default Machinat;
