/** @internal */ /** */
import invariant from 'invariant';
import { maybeInjectContainer } from '@machinat/core/service';
import type { MachinatNode, MachinatChannel } from '@machinat/core/types';
import type { ServiceScope } from '@machinat/core/service/types';
import type {
  MachinatScript,
  CallStatus,
  ContentCommand,
  SetVarsCommand,
  JumpCommand,
  JumpCondCommand,
  PromptCommand,
  CallCommand,
  RenderContentFn,
  ConditionMatchFn,
  VarsSetFn,
  PromptSetFn,
  CallWithVarsFn,
  CallReturnSetFn,
  ReturnValueFn,
} from './types';

const getCursorIndexAssertedly = (
  script: MachinatScript<unknown, unknown, unknown, unknown>,
  key: string
): number => {
  const index = script.entriesIndex.get(key);

  invariant(index !== undefined, `key "${key}" not found in ${script.name}`);
  return index;
};

type FinishedExecuteResult<Return> = {
  finished: true;
  returnValue: Return;
  stack: null;
  content: MachinatNode[];
};

type UnfinishedExecuteResult<Input, Return> = {
  finished: false;
  returnValue: undefined;
  stack: CallStatus<unknown, Input, Return>[];
  content: MachinatNode[];
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
  content: MachinatNode[];
  vars: Vars;
  descendantCallStack: null | CallStatus<Vars, any, any>[];
};

const executeContentCommand = async <Vars>(
  { render }: ContentCommand<Vars>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
  const { cursor, content, vars, channel, scope } = context;
  const rendered = await maybeInjectContainer<RenderContentFn<Vars>>(
    scope,
    render
  )({ platform: channel.platform, channel, vars });

  return {
    ...context,
    cursor: cursor + 1,
    content: [...content, rendered],
  };
};

const executeSetVarsCommand = async <Vars>(
  { setter }: SetVarsCommand<Vars>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<Vars>> => {
  const { cursor, vars, scope, channel } = context;
  const updatedVars = await maybeInjectContainer<VarsSetFn<Vars>>(
    scope,
    setter
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
  { script, key, withVars, setter, goto }: CallCommand<Vars, unknown, unknown>,
  context: ExecuteContext<Vars>
): Promise<ExecuteContext<unknown>> => {
  const { vars, content, scope, channel, cursor } = context;
  const index = goto ? getCursorIndexAssertedly(script, goto) : 0;

  const calleeVars = withVars
    ? await maybeInjectContainer<CallWithVarsFn<Vars, unknown>>(
        scope,
        withVars
      )({ platform: channel.platform, channel, vars })
    : {};

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const result = await executeScript(scope, channel, script, index, calleeVars);
  const concatedContent = [...content, ...result.content];

  if (!result.finished) {
    return {
      ...context,
      content: concatedContent,
      stopAt: key,
      descendantCallStack: result.stack,
    };
  }

  let updatedVars = vars;
  if (setter) {
    updatedVars = await maybeInjectContainer<CallReturnSetFn<Vars, unknown>>(
      scope,
      setter
    )({ platform: channel.platform, channel, vars }, result.returnValue);
  }

  return {
    ...context,
    vars: updatedVars,
    cursor: cursor + 1,
    content: concatedContent,
  };
};

async function executeScript<Vars, Input, Return>(
  scope: ServiceScope,
  channel: MachinatChannel,
  script: MachinatScript<Vars, Input, Return, unknown>,
  begin: number,
  initialVars: Vars
): Promise<ExecuteResult<Input, Return>> {
  const { commands } = script;

  let context: ExecuteContext<unknown> = {
    finished: false,
    stopAt: undefined,
    cursor: begin,
    content: [],
    vars: initialVars,
    descendantCallStack: null,
    scope,
    channel,
  };

  while (context.cursor < commands.length) {
    /* eslint-disable no-await-in-loop */
    const command = commands[context.cursor];

    if (command.type === 'content') {
      context = await executeContentCommand(command, context);
    } else if (command.type === 'set_vars') {
      context = await executeSetVarsCommand(command, context);
    } else if (command.type === 'jump') {
      context = executeJumpCommand(command, context);
    } else if (command.type === 'jump_cond') {
      context = await executeJumpCondCommand(command, context);
    } else if (command.type === 'prompt') {
      context = await executePromptCommand(command, context);
    } else if (command.type === 'call') {
      context = await executeCallCommand(command, context);
    } else if (command.type === 'return') {
      const { valueGetter } = command;

      let returnValue: undefined | Return;
      if (valueGetter) {
        returnValue = await maybeInjectContainer<ReturnValueFn<Return>>(
          scope,
          valueGetter
        )({ platform: channel.platform, vars: context.vars, channel });
      }

      return {
        finished: true,
        returnValue: returnValue as never,
        content: context.content,
        stack: null,
      };
    } else {
      throw new TypeError(
        `unknown command type ${(command as any).type || String(command)}`
      );
    }
    /* eslint-enable no-await-in-loop */

    if (context.stopAt) {
      const { stopAt, content, vars, descendantCallStack } = context;
      const stackStatus = { script, vars, stopAt };

      return {
        finished: false,
        returnValue: undefined,
        content,
        stack: descendantCallStack
          ? [stackStatus, ...descendantCallStack]
          : [stackStatus],
      };
    }
  }

  return {
    finished: true,
    returnValue: undefined as never,
    content: context.content,
    stack: null,
  };
}

async function execute<Vars, Input, Return>(
  scope: ServiceScope,
  channel: MachinatChannel,
  beginningStack: CallStatus<Vars, Input, Return>[],
  isPrompting: boolean,
  input?: Input
): Promise<ExecuteResult<Input, Return>> {
  const callingDepth = beginningStack.length;
  const content: MachinatNode[] = [];
  let currentReturnValue: undefined | Return;

  for (let d = callingDepth - 1; d >= 0; d -= 1) {
    const { script, vars: beginningVars, stopAt } = beginningStack[d];

    let index = stopAt ? getCursorIndexAssertedly(script, stopAt) : 0;
    let vars = beginningVars;

    if (d === callingDepth - 1) {
      if (isPrompting) {
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

        const { setter } = awaitingPrompt;
        const circumstances = {
          platform: channel.platform,
          channel,
          vars: beginningVars,
        };

        vars = setter // eslint-disable-next-line no-await-in-loop
          ? await maybeInjectContainer<PromptSetFn<Vars, unknown>>(
              scope,
              setter
            )(circumstances, input)
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

      const { setter } = awaitingCall;
      if (setter) {
        // eslint-disable-next-line no-await-in-loop
        vars = await maybeInjectContainer<CallReturnSetFn<Vars, Return>>(
          scope,
          setter
        )(
          { platform: channel.platform, vars, channel },
          currentReturnValue as Return
        );
      }

      index += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await executeScript(scope, channel, script, index, vars);
    content.push(...result.content);

    if (!result.finished) {
      return {
        finished: false,
        returnValue: undefined,
        stack: [...beginningStack.slice(0, d), ...result.stack],
        content,
      };
    }

    currentReturnValue = result.returnValue;
  }

  return {
    finished: true,
    returnValue: currentReturnValue as Return,
    stack: null,
    content,
  };
}

export default execute;
