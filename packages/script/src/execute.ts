import invariant from 'invariant';
import type { MachinatNode, MachinatChannel } from '@machinat/core';
import { maybeInjectContainer, ServiceScope } from '@machinat/core/service';
import type {
  ScriptLibrary,
  AnyScriptLibrary,
  CallStatus,
  ContentCommand,
  JumpCommand,
  JumpCondCommand,
  PromptCommand,
  CallCommand,
  EffectCommand,
  ReturnCommand,
  ScriptCommand,
  ContentFn,
  ConditionMatchFn,
  PromptSetFn,
  CallReturnSetFn,
  VarsOfScript,
  InputOfScript,
  ReturnOfScript,
  YieldOfScript,
} from './types';

const getCursorIndexAssertedly = (
  script: ScriptLibrary<unknown, unknown, unknown, unknown, unknown>,
  key: string
): number => {
  const index = script.stopPointIndex.get(key);

  invariant(index !== undefined, `key "${key}" not found in ${script.name}`);
  return index;
};

type FinishedExecuteResult<Return> = {
  finished: true;
  returnedValue: Return;
  yieldedValue: undefined;
  stack: null;
  contents: MachinatNode[];
};

type UnfinishedExecuteResult<Yield, Script extends AnyScriptLibrary> = {
  finished: false;
  returnedValue: undefined;
  yieldedValue: Yield;
  stack: CallStatus<Script>[];
  contents: MachinatNode[];
};

type ExecuteResult<Script extends AnyScriptLibrary> =
  | FinishedExecuteResult<ReturnOfScript<Script>>
  | UnfinishedExecuteResult<YieldOfScript<Script>, Script>;

type ExecuteContext<Vars, Return, Yield> = {
  channel: MachinatChannel;
  scope: ServiceScope;
  finished: boolean;
  returnedValue: undefined | Return;
  stopAt: undefined | string;
  yieldedValue: undefined | Yield;
  cursor: number;
  contents: MachinatNode[];
  vars: Vars;
  descendantCallStack: null | CallStatus<AnyScriptLibrary>[];
};

const executeContentCommand = async <Vars>(
  { getContent }: ContentCommand<Vars>,
  context: ExecuteContext<Vars, unknown, unknown>
): Promise<ExecuteContext<Vars, unknown, unknown>> => {
  const { cursor, contents, vars, channel, scope } = context;
  const newContent = await maybeInjectContainer<ContentFn<Vars>>(
    scope,
    getContent
  )({ platform: channel.platform, channel, vars });

  return {
    ...context,
    cursor: cursor + 1,
    contents: [...contents, newContent],
  };
};

const executeJumpCommand = <Vars>(
  { offset }: JumpCommand,
  context: ExecuteContext<Vars, unknown, unknown>
): ExecuteContext<Vars, unknown, unknown> => {
  return { ...context, cursor: context.cursor + offset };
};

const executeJumpCondCommand = async <Vars>(
  { condition, isNot, offset }: JumpCondCommand<Vars>,
  context: ExecuteContext<Vars, unknown, unknown>
): Promise<ExecuteContext<Vars, unknown, unknown>> => {
  const { cursor, scope, vars, channel } = context;
  const isMatched = await maybeInjectContainer<ConditionMatchFn<Vars>>(
    scope,
    condition
  )({ platform: channel.platform, channel, vars });

  return {
    ...context,
    cursor: cursor + (isMatched !== isNot ? offset : 1),
  };
};

const executePromptCommand = async <Vars, Yield>(
  { key, yieldValue }: PromptCommand<Vars, unknown, Yield>,
  context: ExecuteContext<Vars, unknown, Yield>
): Promise<ExecuteContext<Vars, unknown, Yield>> => {
  const { vars, scope, channel } = context;
  let yieldedValue: undefined | Yield;

  if (yieldValue) {
    yieldedValue = await maybeInjectContainer(
      scope,
      yieldValue
    )({
      platform: channel.platform,
      vars,
      channel,
    });
  }

  return {
    ...context,
    stopAt: key,
    yieldedValue,
  };
};

const executeCallCommand = async <Vars>(
  {
    script,
    key,
    withParams,
    setVars,
    goto,
  }: CallCommand<Vars, unknown, unknown>,
  context: ExecuteContext<Vars, unknown, unknown>
): Promise<ExecuteContext<Vars, unknown, unknown>> => {
  const { vars, contents, scope, channel, cursor } = context;
  const index = goto ? getCursorIndexAssertedly(script, goto) : 0;

  const params = withParams
    ? await maybeInjectContainer(
        scope,
        withParams
      )({ platform: channel.platform, channel, vars })
    : {};

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const result = await executeScript(
    scope,
    channel,
    script,
    index,
    script.initVars(params)
  );
  const concatedContent = [...contents, ...result.contents];

  if (!result.finished) {
    return {
      ...context,
      stopAt: key,
      yieldedValue: result.yieldedValue,
      contents: concatedContent,
      descendantCallStack: result.stack,
    };
  }

  let updatedVars = vars;
  if (setVars) {
    updatedVars = await maybeInjectContainer<CallReturnSetFn<Vars, unknown>>(
      scope,
      setVars
    )({ platform: channel.platform, channel, vars }, result.returnedValue);
  }

  return {
    ...context,
    vars: updatedVars,
    cursor: cursor + 1,
    contents: concatedContent,
  };
};

const executeEffectCommand = async <Vars>(
  { doEffect, setVars }: EffectCommand<Vars, unknown>,
  context: ExecuteContext<Vars, unknown, unknown>
): Promise<ExecuteContext<Vars, unknown, unknown>> => {
  const { cursor, scope, channel, vars } = context;

  let result: unknown;
  if (doEffect) {
    result = await maybeInjectContainer(
      scope,
      doEffect
    )({ platform: channel.platform, channel, vars });
  }

  let newVars = vars;
  if (setVars) {
    newVars = await maybeInjectContainer(scope, setVars)(
      { platform: channel.platform, channel, vars },
      result
    );
  }

  return {
    ...context,
    cursor: cursor + 1,
    vars: newVars,
  };
};

const executeReturnCommand = async <Vars, Return>(
  { getValue }: ReturnCommand<Vars, Return>,
  context: ExecuteContext<Vars, Return, unknown>
): Promise<ExecuteContext<Vars, Return, unknown>> => {
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

const executeCommand = async (
  command: ScriptCommand<unknown, unknown, unknown, unknown>,
  context: ExecuteContext<unknown, unknown, unknown>
): Promise<ExecuteContext<unknown, unknown, unknown>> => {
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

const executeScript = async <Script extends AnyScriptLibrary>(
  scope: ServiceScope,
  channel: MachinatChannel,
  script: Script,
  begin: number,
  beginVars: VarsOfScript<Script>
): Promise<ExecuteResult<Script>> => {
  const { commands } = script;

  let context: ExecuteContext<unknown, unknown, unknown> = {
    finished: false,
    returnedValue: undefined,
    stopAt: undefined,
    yieldedValue: undefined,
    cursor: begin,
    contents: [],
    vars: beginVars,
    descendantCallStack: null,
    scope,
    channel,
  };

  while (context.cursor < commands.length) {
    const command = commands[context.cursor];

    // eslint-disable-next-line no-await-in-loop
    context = await executeCommand(command, context);

    if (context.finished) {
      return {
        finished: true,
        returnedValue: context.returnedValue as ReturnOfScript<Script>,
        yieldedValue: undefined,
        contents: context.contents,
        stack: null,
      };
    }

    if (context.stopAt) {
      const { stopAt, contents, vars, yieldedValue, descendantCallStack } =
        context;
      const stackStatus = { script, vars, stopAt };

      return {
        finished: false,
        returnedValue: undefined,
        yieldedValue: yieldedValue as YieldOfScript<Script>,
        contents,
        stack: (descendantCallStack
          ? [stackStatus, ...descendantCallStack]
          : [stackStatus]) as CallStatus<Script>[],
      };
    }
  }

  // script ends with no RETURN
  return {
    finished: true,
    returnedValue: undefined as never,
    yieldedValue: undefined,
    contents: context.contents,
    stack: null,
  };
};

const execute = async <Script extends AnyScriptLibrary>(
  scope: ServiceScope,
  channel: MachinatChannel,
  beginningStack: CallStatus<Script>[],
  isBeginning: boolean,
  input?: InputOfScript<Script>
): Promise<ExecuteResult<Script>> => {
  const callingDepth = beginningStack.length;
  const contents: MachinatNode[] = [];
  let currentReturnValue: undefined | ReturnOfScript<Script>;

  for (let d = callingDepth - 1; d >= 0; d -= 1) {
    const { script, vars: beginningVars, stopAt } = beginningStack[d];

    let index = stopAt ? getCursorIndexAssertedly(script, stopAt) : 0;
    let vars = beginningVars;

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
          ? await maybeInjectContainer<PromptSetFn<unknown, unknown>>(
              scope,
              setVars
            )(circs, input)
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
        vars = await maybeInjectContainer<
          CallReturnSetFn<unknown, ReturnOfScript<Script>>
        >(scope, setVars)(
          { platform: channel.platform, vars, channel },
          currentReturnValue as ReturnOfScript<Script>
        );
      }

      index += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await executeScript<Script>(
      scope,
      channel,
      script as Script,
      index,
      vars as VarsOfScript<Script>
    );
    contents.push(...result.contents);

    // a PROMPT is met, break the runtime
    if (!result.finished) {
      return {
        finished: false,
        yieldedValue: result.yieldedValue,
        returnedValue: undefined,
        stack: [...beginningStack.slice(0, d), ...result.stack],
        contents,
      };
    }

    currentReturnValue = result.returnedValue;
  }

  return {
    finished: true,
    returnedValue: currentReturnValue as ReturnOfScript<Script>,
    yieldedValue: undefined,
    stack: null,
    contents,
  };
};

export default execute;
