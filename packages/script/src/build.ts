import { MachinatElement } from '@machinat/core/types';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import parseScript from './parse';
import compile from './compile';
import type { ScriptLibrary } from './types';

type ScriptBuildOtions<Vars, Meta> = {
  name: string;
  initiateVars: (vars: Partial<Vars>) => Vars;
  meta?: Meta;
};

const build = <Vars, Input, Return, Meta>(
  options: ScriptBuildOtions<Vars, Meta>,
  src: MachinatElement<unknown, unknown>
): ScriptLibrary<Vars, Input, Return, Meta> => {
  const scriptName = options.name;
  const { meta } = options;
  const { initiateVars } = options;

  const segments = parseScript<Vars, Input, Return>(src);
  const { stopPointIndex, commands } = compile<Vars, Input, Return>(segments, {
    scriptName,
  });

  const script: ScriptLibrary<Vars, Input, Return, Meta> = {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name: scriptName,
    initiateVars,
    stopPointIndex,
    commands,
    meta: meta as Meta,
  };

  return script;
};

export default build;
