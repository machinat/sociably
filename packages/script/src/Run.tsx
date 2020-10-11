import Machinat from '@machinat/core';
import { FunctionalComponent } from '@machinat/core/types';
import { container } from '@machinat/core/service';
import { ProcessorP, ScriptRuntime } from './processor';

type RunProps<Input> = {
  runtime: ScriptRuntime<Input, any>;
  input: Input;
};

export const RunC = container<FunctionalComponent<RunProps<any>>>({
  deps: [ProcessorP],
})(
  (processor: ProcessorP<any, any>) =>
    async function Run<Input>({ runtime, input }: RunProps<Input>) {
      const result = await runtime.run(input);

      return [
        result.content,
        // @ts-expect-error: allow symbol type, follow microsoft/TypeScript/issues/38367
        <Machinat.Thunk effect={() => processor.save(runtime)} />,
      ];
    }
);

export default RunC;
