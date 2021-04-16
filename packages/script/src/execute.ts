import Machinat from '@machinat/core';
import invariant from 'invariant';
import type { MachinatNode, MachinatChannel } from '@machinat/core';
import { maybeInjectContainer, ServiceScope } from '@machinat/core/service';
import type {
  ScriptLibrary,
  AnyScriptLibrary,
  CallStatus,
  ContentCommand,
  VarsCommand,
  JumpCommand,
  JumpCondCommand,
  PromptCommand,
  CallCommand,
  EffectCommand,
  ReturnCommand,
  ScriptCommand,
  ContentFn,
  ConditionMatchFn,
  VarsSetFn,
  PromptSetFn,
  CallReturnSetFn,
  DoEffectFn,
  VarsOfScript,
  InputOfScript,
  ReturnOfScript,
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
  returnValue: Return;
  stack: null;
  contents: MachinatNode[];
};

type UnfinishedExecuteResult<Script extends AnyScriptLibrary> = {
  finished: false;
  returnValue: undefined;
  stack: CallStatus<Script>[];
  contents: MachinatNode[];
};

type ExecuteResult<Script extends AnyScriptLibrary> =
  | FinishedExecuteResult<ReturnOfScript<Script>>
  | UnfinishedExecuteResult<Script>;

type ExecuteContext<Vars> = {
  channel: MachinatChannel;
  scope: ServiceScope;
  finished: boolean;
  stopAt: undefined | string;
  cursor: number;
  contents: MachinatNode[];
  vars: Vars;
  descendantCallStack: null | CallStatus<AnyScriptLibrary>[];
};

const executeContentCommand = async <Vars>(
  { getContent }: ContentCommand<Vars>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
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

const executeVarsCommand = async <Vars>(
  { setVars }: VarsCommand<Vars>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
  const { cursor, vars, scope, channel } = context;
  const updatedVars = await maybeInjectContainer<VarsSetFn<Vars>>(
    scope,
    setVars
  )({ platform: channel.platform, channel, vars });

  return { ...context, cursor: cursor + 1, vars: updatedVars };
};

const executeJumpCommand = <Vars>(
  { offset }: JumpCommand,
  context: ExecuteContext<Vars>
): ExecuteContext<Vars> => {
  return { ...context, cursor: context.cursor + offset };
};

const executeJumpCondCommand = async <Vars>(
  { condition, isNot, offset }: JumpCondCommand<Vars>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
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

const executePromptCommand = async <Vars>(
  command: PromptCommand<Vars, unknown>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
  return { ...context, stopAt: command.key };
};

const executeCallCommand = async <Vars>(
  {
    script,
    key,
    withParams,
    setVars,
    goto,
  }: CallCommand<Vars, unknown, unknown>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
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
      contents: concatedContent,
      stopAt: key,
      descendantCallStack: result.stack,
    };
  }

  let updatedVars = vars;
  if (setVars) {
    updatedVars = await maybeInjectContainer<CallReturnSetFn<Vars, unknown>>(
      scope,
      setVars
    )({ platform: channel.platform, channel, vars }, result.returnValue);
  }

  return {
    ...context,
    vars: updatedVars,
    cursor: cursor + 1,
    contents: concatedContent,
  };
};

const executeEffectCommand = async <Vars>(
  { doEffect }: EffectCommand<Vars>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
  const { contents, cursor, scope, channel, vars } = context;

  const thunkEffect = await maybeInjectContainer<DoEffectFn<Vars>>(
    scope,
    doEffect
  )({ platform: channel.platform, channel, vars });

  return {
    ...context,
    cursor: cursor + 1,
    contents: [
      ...contents,
      Machinat.createElement(Machinat.Thunk, { effect: thunkEffect }),
    ],
  };
};

const executeCommand = async <Vars, Input, Return>(
  command: Exclude<
    ScriptCommand<Vars, Input, Return>,
    ReturnCommand<Vars, Return>
  >,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
  switch (command.type) {
    case 'content':
      return executeContentCommand(command, context);
    case 'vars':
      return executeVarsCommand(command, context);
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
    default:
      throw new TypeError(
        `unknown command type ${
          (command as ScriptCommand<Vars, Input, Return>).type ||
          String(command)
        }`
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

  let context: ExecuteContext<VarsOfScript<Script>> = {
    finished: false,
    stopAt: undefined,
    cursor: begin,
    contents: [],
    vars: beginVars,
    descendantCallStack: null,
    scope,
    channel,
  };

  while (context.cursor < commands.length) {
    const command = commands[context.cursor];

    if (command.type === 'return') {
      const { getValue } = command;
      let returnValue: undefined | ReturnOfScript<Script>;

      if (getValue) {
        // eslint-disable-next-line no-await-in-loop
        returnValue = (await maybeInjectContainer(
          scope,
          getValue
        )({
          platform: channel.platform,
          vars: context.vars,
          channel,
        })) as ReturnOfScript<Script>;
      }

      return {
        finished: true,
        returnValue: returnValue as ReturnOfScript<Script>,
        contents: context.contents,
        stack: null,
      };
    }

    // eslint-disable-next-line no-await-in-loop
    context = (await executeCommand(command, context)) as ExecuteContext<
      VarsOfScript<Script>
    >;

    if (context.stopAt) {
      const { stopAt, contents, vars, descendantCallStack } = context;
      const stackStatus = { script, vars, stopAt };

      return {
        finished: false,
        returnValue: undefined,
        contents,
        stack: (descendantCallStack
          ? [stackStatus, ...descendantCallStack]
          : [stackStatus]) as CallStatus<Script>[],
      };
    }
  }

  return {
    finished: true,
    returnValue: undefined as never,
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
        // begin from stop point
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
      // handle descendant script call return
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

    if (!result.finished) {
      return {
        finished: false,
        returnValue: undefined,
        stack: [...beginningStack.slice(0, d), ...result.stack],
        contents,
      };
    }

    currentReturnValue = result.returnValue;
  }

  return {
    finished: true,
    returnValue: currentReturnValue as ReturnOfScript<Script>,
    stack: null,
    contents,
  };
};

export default execute;
