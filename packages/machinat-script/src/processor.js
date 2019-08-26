// @flow
// @jsx Machinat.createElement
import invariant from 'invariant';
import Machinat from 'machinat';
import { StateService } from 'machinat-session';
import type { SessionStore } from 'machinat-session/types';
import type { EventFrame } from 'machinat-base/types';
import run from './runner';
import { SCRIPT_STATE_KEY } from './constant';
import { archiveScriptState } from './utils';
import type {
  MachinatScript,
  CallingStatus,
  CallingStatusArchive,
  ScriptProcessingState,
} from './types';

const callingStatusLinker = (libs: MachinatScript[]) => {
  const linkings = new Map();
  for (const script of libs) {
    invariant(
      !linkings.has(script.name),
      `script name "${script.name}" duplicated`
    );
    linkings.set(script.name, script);
  }

  return (archive: CallingStatusArchive): CallingStatus => {
    const { name, vars, stoppedAt, iterStack } = archive;

    const script = linkings.get(name);
    invariant(script, `"${name}" not found in linked scripts`);

    return { script, vars, at: stoppedAt, iterStack };
  };
};

export const initProcessComponent = (script: MachinatScript) => {
  const Init = (props: Object) => {
    const result = run([
      { script, vars: props.vars, at: props.goto, iterStack: undefined },
    ]);
    if (result.finished) {
      return result.content;
    }

    return (
      <StateService.Consumer key={SCRIPT_STATE_KEY}>
        {([, setState]) => {
          setState((state: ScriptProcessingState) =>
            state
              ? {
                  ...state,
                  callStack: [
                    ...state.callStack,
                    ...archiveScriptState(result.stack).callStack,
                  ],
                }
              : archiveScriptState(result.stack)
          );

          return result.content;
        }}
      </StateService.Consumer>
    );
  };

  return Init;
};

export const processInterceptor = (
  sessionStore: SessionStore,
  libs: MachinatScript[]
) => {
  const linkerStatus = callingStatusLinker(libs);

  return async (
    frame: EventFrame<any, any, any, any, any, any, any, any>
  ): Promise<null | EventFrame<any, any, any, any, any, any, any, any>> => {
    const { channel } = frame;
    const session = sessionStore.getSession(channel);
    const currentState = await session.get<ScriptProcessingState>(
      SCRIPT_STATE_KEY
    );

    if (!currentState) {
      return frame;
    }

    const stack = currentState.callStack.map(linkerStatus);
    const result = run(stack, frame);

    await frame.reply(result.content);

    if (result.finished) {
      await session.delete(SCRIPT_STATE_KEY);
    } else {
      await session.set(SCRIPT_STATE_KEY, archiveScriptState(result.stack));
    }

    return null;
  };
};
