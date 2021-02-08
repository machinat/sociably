import type { ServiceModule } from '@machinat/core/types';
import { ProcessorP } from './processor';
import { LibraryList as ScriptLibraryList } from './interface';
import type { AnyScriptLibrary } from './types';

type ScriptConfigs = {
  libs?: AnyScriptLibrary[];
};

/**
 * @category Root
 */
const Script = {
  Processor: ProcessorP,
  LibraryList: ScriptLibraryList,

  initModule: ({ libs }: ScriptConfigs = {}): ServiceModule => {
    const libraries =
      libs?.map((lib) => ({
        provide: ScriptLibraryList,
        withValue: lib,
      })) || [];

    return { provisions: [ProcessorP, ...libraries] };
  },
};

/**
 * @category Root
 */
declare namespace Script {
  export type Processor<Input, ReturnValue> = ProcessorP<Input, ReturnValue>;
  export type LibraryList = ScriptLibraryList;
}

export default Script;
