import type { MachinatChannel } from '@machinat/core/types';
import { makeContainer } from '@machinat/core/service';
import ProcessorP from './processor';
import type { ScriptLibrary } from './types';

type StartProps<Vars> = {
  channel: MachinatChannel;
  script: ScriptLibrary<unknown, unknown, unknown, unknown>;
  vars?: Vars;
  goto?: string;
};

const Start = (processor: ProcessorP<unknown, unknown>) => async <Vars>({
  channel,
  script,
  vars,
  goto,
}: StartProps<Vars>) => {
  const runtime = await processor.start(channel, script, { vars, goto });
  return runtime.output();
};

export default makeContainer({ deps: [ProcessorP] as const })(Start);
