import Machinat from '@machinat/core';
import { FunctionalComponent } from '@machinat/core/types';
import { container } from '@machinat/core/service';
import ProcessorP, { ScriptProcessor } from './processor';

const Execute = (processor: ScriptProcessor<any, any>) => async ({
  runtime,
  input,
}) => {
  const result = await runtime.run(input);

  return [
    result.content,
    // @ts-ignore allow symbol type, follow microsoft/TypeScript/issues/38367
    <Machinat.Thunk effect={() => processor.save(runtime)} />,
  ];
};

export default container<FunctionalComponent<any>>({
  deps: [ProcessorP],
})(Execute);
