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
namespace Script {
  export const Processor = ProcessorP;
  export type Processor<Input, ReturnValue> = ProcessorP<Input, ReturnValue>;

  export const LibraryList = LibraryListI;
  export type LibraryList = LibraryListI;

  export const initModule = ({ libs }: ScriptConfigs = {}): ServiceModule => {
    const libraries =
      libs?.map((lib) => ({
        provide: LibraryListI,
        withValue: lib,
      })) || [];

    return { provisions: [ProcessorP, ...libraries] };
  };
}

export default Script;
