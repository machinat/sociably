// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import type { MachinatNode } from '@machinat/core/types';
import type {
  MachinatScript,
  CallStatus,
  ContentCommand,
  SetVarsCommand,
  JumpCommand,
  JumpCondCommand,
  PromptCommand,
  CallCommand,
} from './types';

export const getCursorIndexAssertedly = (
  script: MachinatScript<any, any>,
  key: string
): number => {
  const index = script.entryPointIndex.get(key);

  invariant(index !== undefined, `key "${key}" not found in ${script.name}`);
  return index;
};

type FinishedExecuteResult<Vars> = {
  finished: true,
  finalVars: Vars,
  stack: null,
  content: MachinatNode[],
};

type UnfinishedExecuteResult<Vars> = {
  finished: false,
  finalVars: null,
  stack: CallStatus<Vars, any>[],
  content: MachinatNode[],
};

type ExecuteResult<Vars> =
  | FinishedExecuteResult<Vars>
  | UnfinishedExecuteResult<Vars>;

type ExecuteContext<Vars> = {
  finished: boolean,
  stoppedAt: void | string,
  cursor: number,
  content: MachinatNode[],
  vars: Vars,
  descendantCallStack: void | CallStatus<Vars, any>[],
};

const executeContentCommand = (
  { render }: ContentCommand<any>,
  context: ExecuteContext<any>
): ExecuteContext<any> => {
  const { content, vars } = context;
  content.push(render(vars));

  context.cursor += 1;
  return context;
};

const executeSetVarsCommand = (
  { setter }: SetVarsCommand<any>,
  context: ExecuteContext<any>
): ExecuteContext<any> => {
  context.vars = setter(context.vars);

  context.cursor += 1;
  return context;
};

const executeJumpCommand = (
  { offset }: JumpCommand,
  context: ExecuteContext<any>
): ExecuteContext<any> => {
  context.cursor += offset;
  return context;
};

const executeJumpCondCommand = (
  { condition, isNot, offset }: JumpCondCommand<any>,
  context: ExecuteContext<any>
): ExecuteContext<any> => {
  if (condition(context.vars) !== isNot) {
    context.cursor += offset;
  } else {
    context.cursor += 1;
  }
  return context;
};

const executePromptCommand = (
  command: PromptCommand<any, any>,
  context: ExecuteContext<any>
): ExecuteContext<any> => {
  context.stoppedAt = command.key;
  return context;
};

const executeCallCommand = (
  { script, key, withVars, goto, setter }: CallCommand<any, any>,
  context: ExecuteContext<any>
): ExecuteContext<any> => {
  const { vars, content } = context;
  const index = goto ? getCursorIndexAssertedly(script, goto) : 0;

  const result = executeScript(script, index, withVars ? withVars(vars) : {});
  content.push(...result.content);

  if (!result.finished) {
    context.stoppedAt = key;
    context.descendantCallStack = result.stack;
  } else {
    context.cursor += 1;

    if (setter) {
      context.vars = setter(vars, result.finalVars);
    }
  }

  return context;
};

const executeScript = <Vars>(
  script: MachinatScript<Vars, any>,
  begin: number,
  initialVars: Vars
): ExecuteResult<Vars> => {
  const { commands } = script;

  let context: ExecuteContext<Vars> = {
    finished: false,
    returnValue: undefined,
    stoppedAt: undefined,
    cursor: begin,
    content: [],
    vars: initialVars,
    descendantCallStack: undefined,
  };

  while (context.cursor < commands.length) {
    const command = commands[context.cursor];

    if (command.type === 'content') {
      context = executeContentCommand(command, context);
    } else if (command.type === 'set_vars') {
      context = executeSetVarsCommand(command, context);
    } else if (command.type === 'jump') {
      context = executeJumpCommand(command, context);
    } else if (command.type === 'jump_cond') {
      context = executeJumpCondCommand(command, context);
    } else if (command.type === 'prompt') {
      context = executePromptCommand(command, context);
    } else if (command.type === 'call') {
      context = executeCallCommand(command, context);
    } else if (command.type === 'return') {
      return {
        finished: true,
        finalVars: context.vars,
        content: context.content,
        stack: null,
      };
    } else {
      throw new TypeError(`unknow command type ${command.type}`);
    }

    if (context.finished) {
      return {
        finished: true,
        finalVars: context.vars,
        content: context.content,
        stack: null,
      };
    }

    if (context.stoppedAt) {
      const { stoppedAt, content, vars, descendantCallStack } = context;
      const stackStatus = { script, vars, stoppedAt };

      return {
        finished: false,
        finalVars: null,
        content,
        stack: descendantCallStack
          ? [stackStatus, ...descendantCallStack]
          : [stackStatus],
      };
    }
  }

  return {
    finished: true,
    finalVars: context.vars,
    content: context.content,
    stack: null,
  };
};

const execute = <Vars, Input>(
  beginningStack: CallStatus<Vars, any>[],
  isPrompting: boolean,
  input?: Input
): ExecuteResult<Vars> => {
  const callingDepth = beginningStack.length;
  const content = [];
  let currentCallVars: Vars;

  for (let d = callingDepth - 1; d >= 0; d -= 1) {
    const { script, vars: beginningVars, stoppedAt } = beginningStack[d];

    let index = stoppedAt ? getCursorIndexAssertedly(script, stoppedAt) : 0;
    let vars = beginningVars;

    if (d === callingDepth - 1) {
      if (isPrompting) {
        const awaitingPrompt = script.commands[index];

        invariant(
          awaitingPrompt && awaitingPrompt.type === 'prompt',
          `stopped point "${stoppedAt ||
            ''}" is not a <Prompt/>, the key mapping of ${
            script.name
          } might have been changed`
        );

        vars = awaitingPrompt.setter
          ? awaitingPrompt.setter(beginningVars, input)
          : vars;
        index += 1;
      }
    } else {
      const awaitingCall = script.commands[index];

      invariant(
        awaitingCall.type === 'call',
        `returned point "${stoppedAt ||
          ''}" is not a <Call/>, the key mapping of ${
          script.name
        } might have been changed`
      );

      vars = awaitingCall.setter
        ? awaitingCall.setter(beginningVars, currentCallVars)
        : vars;
      index += 1;
    }

    const result = executeScript(script, index, vars);
    content.push(...result.content);

    if (!result.finished) {
      return {
        finished: false,
        finalVars: null,
        stack: [...beginningStack.slice(0, d), ...result.stack],
        content,
      };
    }

    currentCallVars = result.finalVars;
  }

  return {
    finished: true,
    finalVars: currentCallVars,
    stack: null,
    content,
  };
};

export default execute;
