// @flow
// @jsx Machinat.createElement
import Machinat from '@machinat/core';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import resolveScript from './resolve';
import compile from './compile';
import type { MachinatScript, ScriptNode } from './types';

const build = <Value, Input>(
  scriptName: string,
  src: ScriptNode<Value, Input>
): MachinatScript<Value, Input> => {
  const segments = resolveScript(src);
  const { entryPointIndex, commands } = compile(segments, { scriptName });

  const script: MachinatScript<Value, Input> = {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name: scriptName,
    entryPointIndex,
    commands,
    Init: (null: any),
  };

  script.Init = async ({ channel, processor, goto, vars }) => {
    const runtime = await processor.init(channel, script, {
      vars,
      goto,
    });
    const result = await runtime.run();

    return [
      result.content,
      result.finished ? (
        <Machinat.Thunk effect={() => processor.saveRuntime(runtime)} />
      ) : null,
    ];
  };

  return script;
};

export default build;
