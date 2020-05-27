// @flow
// @jsx Machinat.createElement
import Machinat from '@machinat/core';
import { container } from '@machinat/core/service';
import { MACHINAT_SCRIPT_TYPE } from './constant';
import ScriptProcessor from './processor';
import resolveScript from './resolve';
import compile from './compile';
import type { MachinatScript, ScriptNode } from './types';

const build = <Value, Input, ReturnValue>(
  scriptName: string,
  src: ScriptNode<Value, Input, ReturnValue>
): MachinatScript<Value, Input, ReturnValue> => {
  const segments = resolveScript(src);
  const { entryKeysIndex, commands } = compile(segments, { scriptName });

  const script: MachinatScript<Value, Input, ReturnValue> = {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name: scriptName,
    entryKeysIndex,
    commands,
    Init: (null: any),
  };

  script.Init = container({ deps: [ScriptProcessor] })(
    (processor: ScriptProcessor) => async ({ channel, goto, vars }) => {
      const runtime = await processor.init(channel, script, {
        vars,
        goto,
      });
      const result = await runtime.run();

      return [
        result.content,
        <Machinat.Thunk effect={() => processor.save(runtime)} />,
      ];
    }
  );

  return script;
};

export default build;
