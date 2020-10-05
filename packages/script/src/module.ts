import type { ServiceModule } from '@machinat/core/types';
import type { ServiceProvision } from '@machinat/core/service/types';

import { ProcessorP } from './processor';
import { SCRIPT_LIBS_I } from './constant';
import type { MachinatScript } from './types';

type ScriptModuleConfigs = {
  libs?: MachinatScript<any, any, any, any>[];
};

const Script = {
  Processor: ProcessorP,
  LIBS_I: SCRIPT_LIBS_I,

  initModule: ({ libs }: ScriptModuleConfigs = {}): ServiceModule => {
    const provisions: ServiceProvision<any>[] = [ProcessorP];

    if (libs) {
      provisions.push(
        ...libs.map((lib) => ({ provide: SCRIPT_LIBS_I, withValue: lib }))
      );
    }

    return { provisions };
  },
};

declare namespace Script {
  export type Proccessor<Input, ReturnValue> = ProcessorP<Input, ReturnValue>;
}

export default Script;
