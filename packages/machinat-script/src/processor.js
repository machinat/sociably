// @flow
import type { EventFrame } from 'machinat-base/types';
import type { SessionStore } from 'machinat-session/types';
import { continueRuntime } from './runtime';
import { SCRIPT_STATE_KEY } from './constant';
import { makeScriptState } from './utils';
import type { MachinatScript, ScriptExecuteState } from './types';

const eventProcessor = (
  sessionStore: SessionStore,
  libs: MachinatScript[]
) => async (
  frame: EventFrame<any, any, any, any, any, any, any, any>
): Promise<null | EventFrame<any, any, any, any, any, any, any, any>> => {
  const { channel } = frame;
  const session = sessionStore.getSession(channel);
  const originalState = await session.get<ScriptExecuteState>(SCRIPT_STATE_KEY);

  if (!originalState) {
    return frame;
  }

  const result = continueRuntime(libs, originalState.callStack, frame);

  await frame.reply(result.content);

  if (result.finished) {
    await session.delete(SCRIPT_STATE_KEY);
  } else {
    await session.set(SCRIPT_STATE_KEY, makeScriptState(result.stack));
  }

  return null;
};

export default eventProcessor;
