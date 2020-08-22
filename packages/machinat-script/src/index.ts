import type { ServiceModule } from '@machinat/core/types';
import type { AppProvision } from '@machinat/core/service/types';

import ProcessorP from './processor';
import { SCRIPT_LIBS_I } from './constant';
import type { MachinatScript } from './types';

export { default as build } from './build';
export { default as Execute } from './Execute';
export * from './keyword';

type ScriptModuleConfigs = {
  libs?: MachinatScript<any, any, any, any>[];
};

const Script = {
  Processor: ProcessorP,
  LIBS_I: SCRIPT_LIBS_I,

  initModule: ({ libs }: ScriptModuleConfigs = {}): ServiceModule => {
    const provisions: AppProvision<any>[] = [ProcessorP];

    if (libs) {
      provisions.push(
        ...libs.map((lib) => ({ provide: SCRIPT_LIBS_I, withValue: lib }))
      );
    }

    return { provisions };
  },
};

declare namespace Script {
  export type Proccessor = InstanceType<typeof ProcessorP>;
}

export default Script;
