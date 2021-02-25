import { MachinatElement } from '@machinat/core/types';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import parseScript from './parse';
import compile from './compile';
import type { ScriptLibrary } from './types';

type ScriptBuildOtions<Meta> = {
  meta: Meta;
};

const build = <Vars, Input, Return, Meta>(
  scriptName: string,
  src: MachinatElement<unknown, unknown>,
  options?: ScriptBuildOtions<Meta>
): ScriptLibrary<Vars, Input, Return, Meta> => {
  const segments = parseScript<Vars, Input, Return>(src);
  const { entriesIndex, commands } = compile<Vars, Input, Return>(segments, {
    scriptName,
  });

  const script: ScriptLibrary<Vars, Input, Return, Meta> = {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name: scriptName,
    entriesIndex,
    commands,
    meta: options?.meta as Meta,
  };

  return script;
};

export default build;
