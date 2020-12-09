import { MACHINAT_SCRIPT_TYPE } from './constant';
import resolveScript from './resolve';
import compile from './compile';
import type { MachinatScript, ScriptNode } from './types';

type ScriptBuildOtions<Meta> = {
  meta: Meta;
};

const build = <Value, Input, Return, Meta>(
  scriptName: string,
  src: ScriptNode<Value, Input, Return>,
  options?: ScriptBuildOtions<Meta>
): MachinatScript<Value, Input, Return, Meta> => {
  const segments = resolveScript(src);
  const { entriesIndex, commands } = compile(segments, { scriptName });

  const script: MachinatScript<Value, Input, Return, Meta> = {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name: scriptName,
    entriesIndex,
    commands,
    meta: options?.meta as Meta,
  };

  return script;
};

export default build;
