import { MachinatElement, AnyEventContext } from '@machinat/core';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import parseScript from './parse';
import compile from './compile';
import type { ScriptLibrary } from './types';

type ScriptBuildOtions<Args, Vars, Meta> = {
  name: string;
  initVars: (args: Args) => Vars;
  meta?: Meta;
};

const build = <
  Params,
  Vars extends {},
  Input = AnyEventContext,
  Return = void,
  Meta = null
>(
  options: ScriptBuildOtions<Params, Vars, Meta>,
  src: MachinatElement<unknown, unknown>
): ScriptLibrary<Params, Vars, Input, Return, Meta> => {
  const scriptName = options.name;
  const { meta, initVars } = options;

  const segments = parseScript<Vars, Input, Return>(src);
  const { stopPointIndex, commands } = compile<Vars, Input, Return>(segments, {
    scriptName,
  });

  return {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name: scriptName,
    initVars,
    stopPointIndex,
    commands,
    meta: (meta || null) as Meta,
  };
};

export default build;
