import { MachinatElement, AnyEventContext } from '@machinat/core';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import parseScript from './parse';
import compile from './compile';
import type { ScriptLibrary } from './types';

type ScriptBuildOtions<Params, Vars> = {
  name: string;
  initVars?: (params: Params) => Vars;
};

const build = <
  Vars extends {},
  Input = AnyEventContext,
  Params = {},
  Return = void,
  Yield = void
>(
  options: ScriptBuildOtions<Params, Vars>,
  src: MachinatElement<unknown, unknown>
): ScriptLibrary<Vars, Input, Params, Return, Yield> => {
  const scriptName = options.name;
  const { initVars } = options;

  const segments = parseScript<Vars, Input, Return, Yield>(src);
  const { stopPointIndex, commands } = compile<Vars, Input, Return, Yield>(
    segments,
    { scriptName }
  );

  return {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name: scriptName,
    initVars: initVars || (() => ({} as Vars)),
    stopPointIndex,
    commands,
  };
};

export default build;
