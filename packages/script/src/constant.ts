import { makeInterface } from '@machinat/core/service';
import type { MachinatScript } from './types';

export const MACHINAT_SCRIPT_TYPE = Symbol.for('lib.script.machinat');

/** @internal */
export const SCRIPT_STATE_KEY = '$$machinat:script';

/**
 * @category Interface
 */
export const SCRIPT_LIBS_I = makeInterface<MachinatScript<any, any, any, any>>({
  name: 'ScriptLibsList',
  multi: true,
});
