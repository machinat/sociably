import type { ServiceModule } from '@machinat/core/types';
import { ProcessorP } from './processor';
import { LibraryListI } from './interface';
import type { AnyScriptLibrary } from './types';

type ScriptConfigs = {
  libs?: AnyScriptLibrary[];
};

/**
 * @category Root
 */
const Script = {
  Processor: ProcessorP,
  LibraryList: LibraryListI,

  initModule: ({ libs }: ScriptConfigs = {}): ServiceModule => {
    const libraries =
      libs?.map((lib) => ({
        provide: LibraryListI,
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
  export type LibraryList = LibraryListI;
}

export default Script;
