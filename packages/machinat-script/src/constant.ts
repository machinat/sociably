import { makeInterface } from '@machinat/core/service';
import type { MachinatScript } from './types';

export const MACHINAT_SCRIPT_TYPE = Symbol.for('machinat.component.script');

export const SCRIPT_STATE_KEY = '$$machinat:script';

export const SCRIPT_LIBS_I = makeInterface<MachinatScript<any, any, any, any>>({
  name: 'ScriptLibsList',
  multi: true,
});
