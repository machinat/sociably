import invariant from 'invariant';
import type { ServiceModule } from '@machinat/core';
import ProcessorP from './processor';
import { LibraryListI } from './interface';
import type { AnyScriptLibrary } from './types';

type ScriptModuleConfigs = {
  libs: AnyScriptLibrary[];
};

/**
 * @category Root
 */
namespace Script {
  export const Processor = ProcessorP;
  export type Processor<Script extends AnyScriptLibrary> = ProcessorP<Script>;

  export const LibraryList = LibraryListI;
  export type LibraryList = LibraryListI;

  export const initModule = (configs: ScriptModuleConfigs): ServiceModule => {
    invariant(
      configs?.libs && configs.libs.length > 0,
      'configs.libs should not be empty'
    );

    const libProvisions = configs.libs.map((lib) => ({
      provide: LibraryListI,
      withValue: lib,
    }));

    return { provisions: [ProcessorP, ...libProvisions] };
  };
}

export default Script;
