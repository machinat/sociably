import invariant from 'invariant';
import type { MachinatNode, MachinatChannel } from '@machinat/core';
import { maybeInjectContainer, ServiceScope } from '@machinat/core/service';
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
  script: ScriptLibrary<unknown, unknown, unknown, unknown, unknown>,
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
  contents: MachinatNode[];
};

type UnfinishedExecuteResult<Yield> = {
  finished: false;
  returnedValue: undefined;
  yieldedValue: undefined | Yield;
  callStack: CallStatus<unknown>[];
  contents: MachinatNode[];
};

type ExecuteResult<Return, Yield> =
  | FinishedExecuteResult<Return, Yield>
  | UnfinishedExecuteResult<Yield>;

type ExecuteContext<Vars, Return, Yield> = {
  channel: MachinatChannel;
  scope: ServiceScope;
  finished: boolean;
  returnedValue: undefined | Return;
  stopAt: undefined | string;
  yieldings: [unknown, EffectYielder<unknown, Yield>][];
  cursor: number;
  contents: MachinatNode[];
  vars: Vars;
  callStack: CallStatus<unknown>[];
};

const executeContentCommand = async <Vars, Return, Yield>(
  { getContent }: ContentCommand<Vars>,
  context: ExecuteContext<Vars, Return, Yield>
): Promise<ExecuteContext<Vars, Return, Yield>> => {
  const { cursor, contents, vars, channel, scope } = context;
  const newContent = await maybeInjectContainer(
    scope,
    getContent
  )({ platform: channel.platform, channel, vars });

  return {
    ...context,
    cursor: cursor + 1,
    contents: [...contents, newContent],
  };
};

const executeJumpCommand = <Vars, Return, Yield>(
  { offset }: JumpCommand,
  context: ExecuteContext<Vars, Return, Yield>
): ExecuteContext<Vars, Return, Yield> => {
  return { ...context, cursor: context.cursor + offset };
};

const executeJumpCondCommand = async <Vars, Return, Yield>(
  { condition, isNot, offset }: JumpCondCommand<Vars>,
  context: ExecuteContext<Vars, Return, Yield>
): Promise<ExecuteContext<Vars, Return, Yield>> => {
  const { cursor, scope, vars, channel } = context;
  const isMatched = await maybeInjectContainer(
    scope,
    condition
  )({ platform: channel.platform, channel, vars });

  return {
    ...context,
    cursor: cursor + (isMatched !== isNot ? offset : 1),
  };
};

const executePromptCommand = async <Vars, Return, Yield>(
  { key }: PromptCommand<Vars, unknown>,
  context: ExecuteContext<Vars, Return, Yield>
): Promise<ExecuteContext<Vars, Return, Yield>> => {
  return {
    ...context,
    stopAt: key,
  };
};

const executeCallCommand = async <Vars, Return, Yield>(
  {
    script,
    key,
    withParams,
    setVars,
    goto,
  }: CallCommand<Vars, unknown, unknown, Yield>,
  context: ExecuteContext<Vars, Return, Yield>
): Promise<ExecuteContext<Vars, Return, Yield>> => {
  const { vars, contents, scope, channel, cursor } = context;
  const index = goto ? getCursorIndexAssertedly(script, goto) : 0;

  const params = withParams
    ? await maybeInjectContainer(
        scope,
        withParams
      )({ platform: channel.platform, channel, vars })
    : {};

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const subCtx = await executeScript<unknown, unknown, Yield>(
    scope,
    channel,
    script,
    index,
    script.initVars(params)
  );
  const concatedContent = [...contents, ...subCtx.contents];
  const concatedYieldings = [...context.yieldings, ...subCtx.yieldings];

  if (!subCtx.finished) {
    return {
      ...context,
      stopAt: key,
      yieldings: concatedYieldings,
      contents: concatedContent,
      callStack: subCtx.callStack,
    };
  }

  let updatedVars = vars;
  if (setVars) {
    updatedVars = await maybeInjectContainer(scope, setVars)(
      { platform: channel.platform, channel, vars },
      subCtx.returnedValue
    );
  }

  return {
    ...context,
    vars: updatedVars,
    cursor: cursor + 1,
    contents: concatedContent,
    yieldings: concatedYieldings,
  };
};

const executeEffectCommand = async <Vars, Return, Yield>(
  { setVars, yieldValue }: EffectCommand<Vars, Yield>,
  context: ExecuteContext<Vars, Return, Yield>
): Promise<ExecuteContext<Vars, Return, Yield>> => {
  const { cursor, scope, channel, vars, yieldings } = context;

  let newVars = vars;
  if (setVars) {
    newVars = await maybeInjectContainer(
      scope,
      setVars
    )({ platform: channel.platform, channel, vars });
  }

  let newYielding = yieldings;
  if (yieldValue) {
    newYielding = [...yieldings, [{ ...newVars }, yieldValue]];
  }

  return {
    ...context,
    cursor: cursor + 1,
    vars: newVars,
    yieldings: newYielding,
  };
};

const executeReturnCommand = async <Vars, Return, Yield>(
  { getValue }: ReturnCommand<Vars, Return>,
  context: ExecuteContext<Vars, Return, Yield>
): Promise<ExecuteContext<Vars, Return, Yield>> => {
  const { scope, channel, vars } = context;
  let returnedValue: undefined | Return;

  if (getValue) {
    // eslint-disable-next-line no-await-in-loop
    returnedValue = await maybeInjectContainer(
      scope,
      getValue
    )({
      platform: channel.platform,
      vars,
      channel,
    });
  }

  return {
    ...context,
    finished: true,
    returnedValue,
  };
};

const executeCommand = async <Vars, Return, Yield>(
  command: ScriptCommand<Vars, unknown, Return, Yield>,
  context: ExecuteContext<Vars, Return, Yield>
): Promise<ExecuteContext<Vars, Return, Yield>> => {
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

const executeScript = async <Vars, Return, Yield>(
  scope: ServiceScope,
  channel: MachinatChannel,
  script: ScriptLibrary<Vars, unknown, unknown, Return, Yield>,
  begin: number,
  beginVars: Vars
): Promise<ExecuteContext<Vars, Return, Yield>> => {
  const { commands } = script;

  let context: ExecuteContext<Vars, Return, Yield> = {
    finished: false,
    returnedValue: undefined,
    stopAt: undefined,
    yieldings: [],
    cursor: begin,
    contents: [],
    vars: beginVars,
    callStack: [],
    scope,
    channel,
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

const resolveYieldValue = async <Yield>(
  channel: MachinatChannel,
  scope: ServiceScope,
  yieldings: [unknown, EffectYielder<unknown, Yield>][]
): Promise<undefined | Yield> => {
  let yieldValue: undefined | Yield;

  for (let i = yieldings.length - 1; i >= 0; i -= 1) {
    const [vars, yielder] = yieldings[i];

    // eslint-disable-next-line no-await-in-loop
    yieldValue = await maybeInjectContainer(scope, yielder)(
      { platform: channel.platform, channel, vars },
      yieldValue
    );
  }

  return yieldValue;
};

const execute = async <Input, Return, Yield>(
  scope: ServiceScope,
  channel: MachinatChannel,
  beginningStack: CallStatus<unknown>[],
  isBeginning: boolean,
  input?: Input
): Promise<ExecuteResult<Return, Yield>> => {
  const callingDepth = beginningStack.length;
  const contents: MachinatNode[] = [];
  const yieldings: [unknown, EffectYielder<unknown, Yield>][] = [];

  let returnValueSlot: undefined | unknown;

  for (let d = callingDepth - 1; d >= 0; d -= 1) {
    const { script, vars: beginningVars, stopAt } = beginningStack[d];

    let index = stopAt ? getCursorIndexAssertedly(script, stopAt) : 0;
    let vars: unknown = beginningVars;

    if (d === callingDepth - 1) {
      if (!isBeginning) {
        // begin from the PROMPT point
        const awaitingPrompt = script.commands[index];

        invariant(
          awaitingPrompt && awaitingPrompt.type === 'prompt',
          `stopped point "${
            stopAt || ''
          }" is not a <Prompt/>, the key mapping of ${
            script.name
          } might have been changed`
        );

        const { setVars } = awaitingPrompt;
        const circs = {
          platform: channel.platform,
          channel,
          vars: beginningVars,
        };

        vars = setVars // eslint-disable-next-line no-await-in-loop
          ? await maybeInjectContainer(scope, setVars)(circs, input)
          : vars;

        index += 1;
      }
    } else {
      // handle script CALL return
      const awaitingCall = script.commands[index];

      invariant(
        awaitingCall.type === 'call',
        `returned point "${
          stopAt || ''
        }" is not a <Call/>, the key mapping of ${
          script.name
        } might have been changed`
      );

      const { setVars } = awaitingCall;
      if (setVars) {
        // eslint-disable-next-line no-await-in-loop
        vars = await maybeInjectContainer(scope, setVars)(
          { platform: channel.platform, vars, channel },
          returnValueSlot as Return
        );
      }

      index += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    const context = await executeScript(scope, channel, script, index, vars);
    contents.push(...context.contents);
    yieldings.push(
      ...(context.yieldings as [unknown, EffectYielder<unknown, Yield>][])
    );

    // a PROMPT is met, break the runtime
    if (!context.finished) {
      // eslint-disable-next-line no-await-in-loop
      const yieldedValue = await resolveYieldValue(channel, scope, yieldings);
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

  const yieldedValue = await resolveYieldValue(channel, scope, yieldings);
  return {
    finished: true,
    returnedValue: returnValueSlot as Return,
    yieldedValue,
    callStack: null,
    contents,
  };
};

export default execute;
