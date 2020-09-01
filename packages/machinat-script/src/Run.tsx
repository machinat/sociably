import Machinat from '@machinat/core';
import { FunctionalComponent } from '@machinat/core/types';
import { container } from '@machinat/core/service';
import { ProcessorP } from './processor';

const Run = (processor: ProcessorP<any, any>) => async ({ runtime, input }) => {
  const result = await runtime.run(input);

  return [
    result.content,
    // @ts-ignore allow symbol type, follow microsoft/TypeScript/issues/38367
    <Machinat.Thunk effect={() => processor.save(runtime)} />,
  ];
};

export const RunC = container<FunctionalComponent<any>>({
  deps: [ProcessorP],
})(Run);

export default RunC;
