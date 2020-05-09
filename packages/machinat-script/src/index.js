// @flow
import type { ServiceModule } from '@machinat/core/types';
import ScriptProcessor from './processor';
import { SCRIPT_LIBS_I } from './constant';
import type { MachinatScript } from './types';

export { default as build } from './build';
export * from './keyword';

type ScriptModuleConfigs = {
  libs?: MachinatScript<any, any>[],
};

const Script = {
  Processor: ScriptProcessor,
  LIBS_I: SCRIPT_LIBS_I,

  initModule: ({ libs }: ScriptModuleConfigs = {}): ServiceModule => {
    const provisions = [ScriptProcessor];

    if (libs) {
      provisions.push(
        ...libs.map((lib) => ({ provide: SCRIPT_LIBS_I, withValue: lib }))
      );
    }

    return { provisions };
  },
};

export default Script;
