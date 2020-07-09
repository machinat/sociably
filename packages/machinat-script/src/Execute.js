// @flow
// @jsx Machinat.createElement
import Machinat from '@machinat/core';
import type { FunctionalComponent } from '@machinat/core/types';
import { container } from '@machinat/core/service';
import ScriptProcessor from './processor';

const Execute = (processor: ScriptProcessor) => async ({ runtime, input }) => {
  const result = await runtime.run(input);

  return [
    result.content,
    <Machinat.Thunk effect={() => processor.save(runtime)} />,
  ];
};

export default container<FunctionalComponent<any>>({ deps: [ScriptProcessor] })(
  Execute
);
