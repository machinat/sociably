import type { MachinatChannel } from '@machinat/core';
import { makeContainer } from '@machinat/core/service';
import ProcessorP from './processor';
import type { ScriptLibrary, ParamsOfScript } from './types';

type StartRuntimeProps<
  Script extends ScriptLibrary<unknown, unknown, unknown, unknown, unknown>
> = {
  channel: MachinatChannel;
  script: Script;
  params?: ParamsOfScript<Script>;
  goto?: string;
};

const StartRuntime = <
  Script extends ScriptLibrary<unknown, unknown, unknown, unknown, unknown>
>(
  processor: ProcessorP<Script>
) => async ({ channel, script, params, goto }: StartRuntimeProps<Script>) => {
  const runtime = await processor.start(channel, script, { params, goto });
  return runtime.output();
};

export default makeContainer({ deps: [ProcessorP] })(StartRuntime);
