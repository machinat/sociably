// @flow
// @jsx Machinat
import Machinat from 'machinat';
import { StateService } from 'machinat-session';
import { MACHINAT_SCRIPT_TYPE, SCRIPT_STATE_KEY } from './constant';
import resolveScript from './resolve';
import compile from './compile';
import { initRuntime } from './runtime';
import { makeScriptState } from './utils';
import type { MachinatScriptType, MachinatScriptNode } from './types';

const build = (name: string, src: MachinatScriptNode): MachinatScriptType => {
  const segments = resolveScript(src);
  const { keyMapping, commands } = compile(segments);

  const script: MachinatScriptType = {
    $$typeof: MACHINAT_SCRIPT_TYPE,
    name,
    _keyMapping: keyMapping,
    _commands: commands,
    Init: ({ vars, goTo }) => {
      const result = initRuntime(script, vars, goTo);
      if (result.finished) {
        return result.content;
      }

      return (
        <StateService.Consumer key={SCRIPT_STATE_KEY}>
          {([, setState]) => {
            setState(state =>
              state
                ? { callStack: [...state.callStack, ...result.stack] }
                : makeScriptState(result.stack)
            );

            return result.content;
          }}
        </StateService.Consumer>
      );
    },
  };

  return script;
};

export default build;
