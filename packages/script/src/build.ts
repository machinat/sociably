import {
  makeContainer,
  RenderingChannel,
  SociablyElement,
  AnyEventContext,
} from '@sociably/core';
import { SOCIABLY_SCRIPT_TYPE } from './constant';
import parseScript from './parse';
import compile from './compile';
import ProcessorP from './processor';
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
  src: SociablyElement<unknown, unknown>
): ScriptLibrary<Vars, Input, Params, Return, Yield> => {
  const scriptName = options.name;
  const { initVars } = options;

  const segments = parseScript<Vars, Input, Return, Yield>(src);
  const { stopPointIndex, commands } = compile<Vars, Input, Return, Yield>(
    segments,
    { scriptName }
  );

  const lib: ScriptLibrary<Vars, Input, Params, Return, Yield> = {
    $$typeof: SOCIABLY_SCRIPT_TYPE,
    Start: null as never,
    name: scriptName,
    initVars: initVars || (() => ({} as Vars)),
    stopPointIndex,
    commands,
  };

  lib.Start = makeContainer({
    deps: [ProcessorP, RenderingChannel],
    name: scriptName,
  })((processor, channel) => async ({ params, goto }) => {
    if (!channel) {
      return null;
    }

    const runtime = await processor.start(channel, lib, { params, goto });
    return runtime.output();
  });

  return lib;
};

export default build;
