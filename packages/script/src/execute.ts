import Machinat from '@machinat/core';
import invariant from 'invariant';
import { maybeInjectContainer } from '@machinat/core/service';
import type { MachinatNode, MachinatChannel } from '@machinat/core/types';
import type { ServiceScope } from '@machinat/core/service/types';
import type {
  ScriptLibrary,
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
  ReturnValueFn,
} from './types';

const getCursorIndexAssertedly = (
  script: ScriptLibrary<unknown, unknown, unknown, unknown>,
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

type UnfinishedExecuteResult<Input, Return> = {
  finished: false;
  returnValue: undefined;
  stack: CallStatus<unknown, Input, Return>[];
  contents: MachinatNode[];
};

type ExecuteResult<Input, Return> =
  | FinishedExecuteResult<Return>
  | UnfinishedExecuteResult<Input, Return>;

type ExecuteContext<Vars> = {
  channel: MachinatChannel;
  scope: ServiceScope;
  finished: boolean;
  stopAt: undefined | string;
  cursor: number;
  contents: MachinatNode[];
  vars: Vars;
  descendantCallStack: null | CallStatus<Vars, any, any>[];
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
  { script, key, withVars, setVars, goto }: CallCommand<Vars, unknown, unknown>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
  const { vars, contents, scope, channel, cursor } = context;
  const index = goto ? getCursorIndexAssertedly(script, goto) : 0;

  const calleeVars = withVars
    ? await maybeInjectContainer(
        scope,
        withVars
      )({ platform: channel.platform, channel, vars })
    : {};

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const result = await executeScript(
    scope,
    channel,
    script,
    index,
    script.initiateVars(calleeVars)
  );
  const concatedContent = [...contents, ...result.contents];

  if (!result.finished) {
    return {
      ...context,
      contents: concatedContent,
      stopAt: key,
      descendantCallStack: result.stack as CallStatus<Vars, unknown, unknown>[],
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

const executeScript = async <Vars, Input, Return>(
  scope: ServiceScope,
  channel: MachinatChannel,
  script: ScriptLibrary<Vars, Input, Return, unknown>,
  begin: number,
  beginVars: Vars
): Promise<ExecuteResult<Input, Return>> => {
  const { commands } = script;

  let context: ExecuteContext<Vars> = {
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
      let returnValue: undefined | Return;

      if (getValue) {
        // eslint-disable-next-line no-await-in-loop
        returnValue = await maybeInjectContainer<ReturnValueFn<Vars, Return>>(
          scope,
          getValue
        )({ platform: channel.platform, vars: context.vars, channel });
      }

      return {
        finished: true,
        returnValue: returnValue as Return,
        contents: context.contents,
        stack: null,
      };
    }

    context = await executeCommand(command, context); // eslint-disable-line no-await-in-loop

    if (context.stopAt) {
      const { stopAt, contents, vars, descendantCallStack } = context;
      const stackStatus = { script, vars, stopAt };

      return {
        finished: false,
        returnValue: undefined,
        contents,
        stack: descendantCallStack
          ? [stackStatus, ...descendantCallStack]
          : [stackStatus],
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

const execute = async <Vars, Input, Return>(
  scope: ServiceScope,
  channel: MachinatChannel,
  beginningStack: CallStatus<Vars, Input, Return>[],
  isBeginning: boolean,
  input?: Input
): Promise<ExecuteResult<Input, Return>> => {
  const callingDepth = beginningStack.length;
  const contents: MachinatNode[] = [];
  let currentReturnValue: undefined | Return;

  for (let d = callingDepth - 1; d >= 0; d -= 1) {
    const { script, vars: beginningVars, stopAt } = beginningStack[d];

    let index = stopAt ? getCursorIndexAssertedly(script, stopAt) : 0;
    let vars = beginningVars;

    if (d === callingDepth - 1) {
      if (isBeginning) {
        vars = script.initiateVars(vars);
      } else {
        // handle begin from prompt point
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
          ? await maybeInjectContainer<PromptSetFn<Vars, unknown>>(
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
        vars = await maybeInjectContainer<CallReturnSetFn<Vars, Return>>(
          scope,
          setVars
        )(
          { platform: channel.platform, vars, channel },
          currentReturnValue as Return
        );
      }

      index += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await executeScript(scope, channel, script, index, vars);
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
    returnValue: currentReturnValue as Return,
    stack: null,
    contents,
  };
};

export default execute;
