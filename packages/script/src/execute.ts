import invariant from 'invariant';
import type { SociablyNode, SociablyThread } from '@sociably/core';
import { maybeInjectContainer, ServiceScope } from '@sociably/core/service';
import type {
  ScriptLibrary,
  CallStatus,
  ContentCommand,
  JumpCommand,
  JumpCondCommand,
  PromptCommand,
  CallCommand,
  EffectYielder,
  EffectCommand,
  ReturnCommand,
  ScriptCommand,
} from './types';

const getCursorIndexAssertedly = (
  script: ScriptLibrary<unknown, unknown, unknown, unknown, unknown, unknown>,
  key: string
): number => {
  const index = script.stopPointIndex.get(key);

  invariant(index !== undefined, `key "${key}" not found in ${script.name}`);
  return index;
};

type FinishedExecuteResult<Return, Yield> = {
  finished: true;
  returnedValue: Return;
  yieldedValue: undefined | Yield;
  callStack: null;
  contents: SociablyNode[];
};

type UnfinishedExecuteResult<Yield> = {
  finished: false;
  returnedValue: undefined;
  yieldedValue: undefined | Yield;
  callStack: CallStatus<unknown>[];
  contents: SociablyNode[];
};

type ExecuteResult<Return, Yield> =
  | FinishedExecuteResult<Return, Yield>
  | UnfinishedExecuteResult<Yield>;

type PendingYields<Yield, Meta> = {
  vars: unknown;
  meta: Meta;
  yielder: EffectYielder<unknown, Yield, Meta>;
};

type ExecuteContext<Vars, Return, Yield, Meta> = {
  thread: SociablyThread;
  scope: ServiceScope;
  finished: boolean;
  returnedValue: undefined | Return;
  stopAt: undefined | string;
  yields: PendingYields<Yield, Meta>[];
  cursor: number;
  contents: SociablyNode[];
  vars: Vars;
  meta: Meta;
  callStack: CallStatus<unknown>[];
};

const executeContentCommand = async <Vars, Return, Yield, Meta>(
  { getContent }: ContentCommand<Vars, Meta>,
  context: ExecuteContext<Vars, Return, Yield, Meta>
): Promise<ExecuteContext<Vars, Return, Yield, Meta>> => {
  const { cursor, contents, vars, meta, thread, scope } = context;
  const newContent = await maybeInjectContainer(
    scope,
    getContent
  )({ platform: thread.platform, thread, vars, meta });

  return {
    ...context,
    cursor: cursor + 1,
    contents: [...contents, newContent],
  };
};

const executeJumpCommand = <Vars, Return, Yield, Meta>(
  { offset }: JumpCommand,
  context: ExecuteContext<Vars, Return, Yield, Meta>
): ExecuteContext<Vars, Return, Yield, Meta> => {
  return { ...context, cursor: context.cursor + offset };
};

const executeJumpCondCommand = async <Vars, Return, Yield, Meta>(
  { condition, isNot, offset }: JumpCondCommand<Vars, Meta>,
  context: ExecuteContext<Vars, Return, Yield, Meta>
): Promise<ExecuteContext<Vars, Return, Yield, Meta>> => {
  const { cursor, scope, vars, meta, thread } = context;
  const isMatched = await maybeInjectContainer(
    scope,
    condition
  )({ platform: thread.platform, thread, vars, meta });

  return {
    ...context,
    cursor: cursor + (isMatched !== isNot ? offset : 1),
  };
};

const executePromptCommand = async <Vars, Return, Yield, Meta>(
  { key }: PromptCommand<Vars, unknown, Meta>,
  context: ExecuteContext<Vars, Return, Yield, Meta>
): Promise<ExecuteContext<Vars, Return, Yield, Meta>> => {
  return {
    ...context,
    stopAt: key,
  };
};

const executeCallCommand = async <Vars, Return, Yield, Meta>(
  {
    script,
    key,
    withParams,
    setVars,
    goto,
  }: CallCommand<Vars, unknown, unknown, Yield, Meta>,
  context: ExecuteContext<Vars, Return, Yield, Meta>
): Promise<ExecuteContext<Vars, Return, Yield, Meta>> => {
  const { vars, meta, contents, scope, thread, cursor } = context;
  const index = goto ? getCursorIndexAssertedly(script, goto) : 0;

  const params = withParams
    ? await maybeInjectContainer(
        scope,
        withParams
      )({ platform: thread.platform, thread, vars, meta })
    : {};

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const subCtx = await executeScript<unknown, unknown, Yield, Meta>(
    scope,
    thread,
    script,
    index,
    script.initVars(params)
  );
  const concatedContent = [...contents, ...subCtx.contents];
  const concatedYields = [...context.yields, ...subCtx.yields];

  if (!subCtx.finished) {
    return {
      ...context,
      stopAt: key,
      yields: concatedYields,
      contents: concatedContent,
      callStack: subCtx.callStack,
    };
  }

  let updatedVars = vars;
  if (setVars) {
    updatedVars = await maybeInjectContainer(scope, setVars)(
      { platform: thread.platform, thread, vars, meta },
      subCtx.returnedValue
    );
  }

  return {
    ...context,
    vars: updatedVars,
    cursor: cursor + 1,
    contents: concatedContent,
    yields: concatedYields,
  };
};

const executeEffectCommand = async <Vars, Return, Yield, Meta>(
  { setVars, yieldValue }: EffectCommand<Vars, Yield, Meta>,
  context: ExecuteContext<Vars, Return, Yield, Meta>
): Promise<ExecuteContext<Vars, Return, Yield, Meta>> => {
  const { cursor, scope, thread, vars, meta, yields } = context;

  let newVars = vars;
  if (setVars) {
    newVars = await maybeInjectContainer(
      scope,
      setVars
    )({ platform: thread.platform, thread, vars, meta });
  }

  let newYielding = yields;
  if (yieldValue) {
    newYielding = [
      ...yields,
      { vars: { ...newVars }, meta, yielder: yieldValue },
    ];
  }

  return {
    ...context,
    cursor: cursor + 1,
    vars: newVars,
    yields: newYielding,
  };
};

const executeReturnCommand = async <Vars, Return, Yield, Meta>(
  { getValue }: ReturnCommand<Vars, Return, Meta>,
  context: ExecuteContext<Vars, Return, Yield, Meta>
): Promise<ExecuteContext<Vars, Return, Yield, Meta>> => {
  const { scope, thread, vars, meta } = context;
  let returnedValue: undefined | Return;

  if (getValue) {
    // eslint-disable-next-line no-await-in-loop
    returnedValue = await maybeInjectContainer(
      scope,
      getValue
    )({
      platform: thread.platform,
      vars,
      meta,
      thread,
    });
  }

  return {
    ...context,
    finished: true,
    returnedValue,
  };
};

const executeCommand = async <Vars, Return, Yield, Meta>(
  command: ScriptCommand<Vars, unknown, Return, Yield, Meta>,
  context: ExecuteContext<Vars, Return, Yield, Meta>
): Promise<ExecuteContext<Vars, Return, Yield, Meta>> => {
  switch (command.type) {
    case 'content':
      return executeContentCommand(command, context);
    case 'jump':
      return executeJumpCommand(command, context);
    case 'jump_cond':
      return executeJumpCondCommand(command, context);
    case 'prompt':
      return executePromptCommand(command, context);
    case 'call':
      return executeCallCommand(command, context);
    case 'effect':
      return executeEffectCommand(command, context);
    case 'return':
      return executeReturnCommand(command, context);
    default:
      throw new TypeError(
        `unknown command type ${(command as any).type || String(command)}`
      );
  }
};

const executeScript = async <Vars, Return, Yield, Meta>(
  scope: ServiceScope,
  thread: SociablyThread,
  script: ScriptLibrary<Vars, unknown, unknown, Return, Yield, Meta>,
  begin: number,
  beginVars: Vars
): Promise<ExecuteContext<Vars, Return, Yield, Meta>> => {
  const { commands } = script;

  let context: ExecuteContext<Vars, Return, Yield, Meta> = {
    finished: false,
    returnedValue: undefined,
    stopAt: undefined,
    yields: [],
    cursor: begin,
    contents: [],
    vars: beginVars,
    meta: script.meta,
    callStack: [],
    scope,
    thread,
  };

  while (context.cursor < commands.length) {
    const command = commands[context.cursor];

    // eslint-disable-next-line no-await-in-loop
    context = await executeCommand(command, context);

    if (context.finished) {
      return context;
    }

    if (context.stopAt) {
      const { stopAt, vars, callStack } = context;
      const stackStatus = { script, vars, stopAt };

      return {
        ...context,
        callStack: callStack ? [stackStatus, ...callStack] : [stackStatus],
      };
    }
  }

  // script ends with no RETURN
  return {
    ...context,
    finished: true,
  };
};

const resolveYieldValue = async <Vars, Yield, Meta>(
  thread: SociablyThread,
  scope: ServiceScope,
  yields: PendingYields<Yield, Meta>[]
): Promise<undefined | Yield> => {
  let yieldValue: undefined | Yield;

  for (let i = yields.length - 1; i >= 0; i -= 1) {
    const { vars, meta, yielder } = yields[i];

    // eslint-disable-next-line no-await-in-loop
    yieldValue = await maybeInjectContainer(scope, yielder)(
      { platform: thread.platform, thread, vars, meta },
      yieldValue
    );
  }

  return yieldValue;
};

const execute = async <Input, Return, Yield, Meta>(
  scope: ServiceScope,
  thread: SociablyThread,
  beginningStack: CallStatus<unknown>[],
  isPrompting: boolean,
  input?: Input
): Promise<ExecuteResult<Return, Yield>> => {
  const callingDepth = beginningStack.length;
  const contents: SociablyNode[] = [];
  const yields: PendingYields<Yield, Meta>[] = [];

  let returnValueSlot: undefined | unknown;

  for (let d = callingDepth - 1; d >= 0; d -= 1) {
    const { script, vars: beginningVars, stopAt } = beginningStack[d];
    const currentScript = script as ScriptLibrary<
      unknown,
      Input,
      unknown,
      Return,
      Yield,
      Meta
    >;

    let index = stopAt ? getCursorIndexAssertedly(currentScript, stopAt) : 0;
    let vars: unknown = beginningVars;

    if (d === callingDepth - 1) {
      if (isPrompting) {
        // begin from the PROMPT point
        const awaitingPrompt = currentScript.commands[index];

        invariant(
          awaitingPrompt && awaitingPrompt.type === 'prompt',
          `stopped point "${
            stopAt || ''
          }" is not a <Prompt/>, the key mapping of ${
            currentScript.name
          } might have been changed`
        );

        const { setVars } = awaitingPrompt;
        const circs = {
          platform: thread.platform,
          thread,
          vars: beginningVars,
          meta: currentScript.meta,
        };

        vars = setVars // eslint-disable-next-line no-await-in-loop
          ? await maybeInjectContainer(scope, setVars)(circs, input as Input)
          : vars;

        index += 1;
      }
    } else {
      // handle script CALL return
      const awaitingCall = currentScript.commands[index];

      invariant(
        awaitingCall.type === 'call',
        `returned point "${
          stopAt || ''
        }" is not a <Call/>, the key mapping of ${
          currentScript.name
        } might have been changed`
      );

      const { setVars } = awaitingCall;
      if (setVars) {
        // eslint-disable-next-line no-await-in-loop
        vars = await maybeInjectContainer(scope, setVars)(
          {
            platform: thread.platform,
            vars,
            meta: currentScript.meta,
            thread,
          },
          returnValueSlot as Return
        );
      }

      index += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    const context = await executeScript(
      scope,
      thread,
      currentScript,
      index,
      vars
    );
    contents.push(...context.contents);
    yields.push(...context.yields);

    // a PROMPT is met, break the runtime
    if (!context.finished) {
      // eslint-disable-next-line no-await-in-loop
      const yieldedValue = await resolveYieldValue(thread, scope, yields);
      return {
        finished: false,
        yieldedValue,
        returnedValue: undefined,
        callStack: [...beginningStack.slice(0, d), ...context.callStack],
        contents,
      };
    }

    returnValueSlot = context.returnedValue;
  }

  const yieldedValue = await resolveYieldValue(thread, scope, yields);
  return {
    finished: true,
    returnedValue: returnValueSlot as Return,
    yieldedValue,
    callStack: null,
    contents,
  };
};

export default execute;
