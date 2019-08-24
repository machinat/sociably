// @flow
import { MACHINAT_SCRIPT_TYPE } from './constant';
import resolveScript from './resolve';
import compile from './compile';
import { initProcessComponent } from './processor';
import type { MachinatScript, MachinatScriptNode } from './types';

const build = (name: string, src: MachinatScriptNode): MachinatScript => {
  const segments = resolveScript(src);
  const { keyMapping, commands } = compile(segments);

  const script: MachinatScript = {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name,
    _keyMapping: keyMapping,
    _commands: commands,
    Init: (null: any),
  };

  script.Init = initProcessComponent(script);
  return script;
};

export default build;
