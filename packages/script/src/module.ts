import type { ServiceModule } from '@sociably/core';
import ProcessorP from './Processor.js';
import { LibraryAccessorI } from './interface.js';
import type { AnyScriptLibrary } from './types.js';

type ScriptModuleConfigs = {
  libs?: AnyScriptLibrary[];
};

const createScriptAccessorOfLibs = (
  libs: AnyScriptLibrary[]
): LibraryAccessorI => {
  const libMap = new Map(libs.map((lib) => [lib.name, lib]));
  return {
    getScript: (name: string) => libMap.get(name) ?? null,
  };
};

/**
 * @category Root
 */
namespace Script {
  export const Processor = ProcessorP;
  export type Processor<Script extends AnyScriptLibrary> = ProcessorP<Script>;

  export const LibraryAccessor = LibraryAccessorI;
  export type LibraryAccessor = LibraryAccessorI;

  export const initModule = ({ libs }: ScriptModuleConfigs): ServiceModule => {
    const provisions = [
      ProcessorP,
      {
        provide: LibraryAccessor,
        withValue: createScriptAccessorOfLibs(libs || []),
      },
    ];

    return { provisions };
  };
}

export default Script;
