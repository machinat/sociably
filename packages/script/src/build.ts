import {
  serviceContainer,
  RenderingTarget,
  SociablyElement,
  AnyEventContext,
} from '@sociably/core';
import { SOCIABLY_SCRIPT_TYPE } from './constant';
import parseScript from './parse';
import compile from './compile';
import ProcessorP from './processor';
import type { ScriptLibrary } from './types';

type ScriptBuildOtions<Params, Vars, Meta> = {
  name: string;
  initVars?: (params: Params) => Vars;
} & (Meta extends void ? { meta?: void } : { meta: Meta });

const build = <
  Vars extends {},
  Input = AnyEventContext,
  Params = {},
  Return = void,
  Yield = void,
  Meta = void
>(
  { name: scriptName, initVars, meta }: ScriptBuildOtions<Params, Vars, Meta>,
  src: SociablyElement<unknown, unknown>
): ScriptLibrary<Vars, Input, Params, Return, Yield, Meta> => {
  const segments = parseScript<Vars, Input, Return, Yield, Meta>(src);
  const compiled = compile<Vars, Input, Return, Yield, Meta>(segments, {
    scriptName,
  });

  const lib: ScriptLibrary<Vars, Input, Params, Return, Yield, Meta> = {
    $$typeof: SOCIABLY_SCRIPT_TYPE,
    Start: null as never,
    name: scriptName,
    initVars: initVars || (() => ({} as Vars)),
    stopPointIndex: compiled.stopPointIndex,
    commands: compiled.commands,
    meta: meta as Meta,
  };

  lib.Start = serviceContainer({
    deps: [ProcessorP, RenderingTarget],
    name: scriptName,
  })((processor, thread) => async ({ params, goto }) => {
    if (!thread) {
      return null;
    }

    const runtime = await processor.start(thread, lib, { params, goto });
    return runtime.output();
  });

  return lib;
};

export default build;
