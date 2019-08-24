// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import type { MachinatNode } from 'machinat/types';
import type { MachinatScript, Vars, CallingStatus, IterStatus } from './types';

export const merge = (...objs: Object[]) => Object.assign({}, ...objs);

export const getCursorIndex = (script: MachinatScript, key: string): number => {
  const index = script._keyMapping.get(key);

  invariant(
    index !== undefined,
    `stopped point key "${key}" not found in ${script.name}`
  );
  return index;
};

type FinishedExecuteResult = {
  finished: true,
  stack: void,
  content: MachinatNode[],
};

type UnfinishedExecuteResult = {
  finished: false,
  stack: CallingStatus[],
  content: MachinatNode[],
};

type ExecuteResult = FinishedExecuteResult | UnfinishedExecuteResult;

type ExecuteContext = {
  stoppedAt: void | string,
  cursor: number,
  content: MachinatNode[],
  vars: Vars,
  iterStack: void | IterStatus[],
  descendantCallStack: void | CallingStatus[],
};

const executeContentCommand = (
  command,
  context: ExecuteContext
): ExecuteContext => {
  const { content, vars } = context;
  content.push(command.render(vars));

  context.cursor += 1;
  return context;
};

const executeSetVarsCommand = (
  command,
  context: ExecuteContext
): ExecuteContext => {
  const { vars } = context;
  context.vars = merge(vars, command.setter(vars));

  context.cursor += 1;
  return context;
};

const executeJumpCommand = (
  command,
  context: ExecuteContext
): ExecuteContext => {
  context.cursor += command.offset;
  return context;
};

const executeJumpCondCommand = (
  command,
  context: ExecuteContext
): ExecuteContext => {
  const { condition, isNot, offset } = command;
  if (condition(context.vars) !== isNot) {
    context.cursor += offset;
  } else {
    context.cursor += 1;
  }
  return context;
};

const executePromptCommand = (
  command,
  context: ExecuteContext
): ExecuteContext => {
  context.stoppedAt = command.key;
  return context;
};

const executeCallCommand = (
  command,
  context: ExecuteContext
): ExecuteContext => {
  const { script, key, withVars, gotoKey } = command;
  const { vars, content } = context;
  const index = gotoKey ? getCursorIndex(script, gotoKey) : 0;

  const result = execute(script, index, withVars ? withVars(vars) : {});
  content.push(...result.content);

  if (!result.finished) {
    context.stoppedAt = key;
    context.descendantCallStack = result.stack;
  } else {
    context.cursor += 1;
  }

  return context;
};

const executeIterOutsetCommand = (
  command,
  context: ExecuteContext
): ExecuteContext => {
  const { iterName, varName, getIterable, endingOffset } = command;
  let { iterStack, vars } = context;

  let iterStatus;
  if (
    iterStack &&
    (iterStatus = iterStack[iterStack.length - 1]) &&
    iterStatus.name === iterName
  ) {
    // when continuing iteration
    iterStatus.index += 1;
  } else {
    // new iteration
    const iterTarget = [...getIterable(vars)];
    iterStatus = {
      name: iterName,
      iterTarget,
      originalVar: varName ? vars[varName] : undefined,
      index: 0,
    };

    if (iterStack) {
      iterStack.push(iterStatus);
    } else {
      iterStack = [iterStatus];
    }
  }

  const { iterTarget, originalVar, index } = iterStatus;
  if (index < iterStatus.iterTarget.length) {
    // continue iteration
    context.cursor += 1;
    if (varName) {
      vars = { ...vars, [varName]: iterTarget[index] };
    }
  } else {
    // end iteration
    context.cursor += endingOffset;
    if (varName) {
      vars = { ...vars, [varName]: originalVar };
    }

    iterStack.pop();
    if (iterStack.length === 0) {
      iterStack = undefined;
    }
  }

  context.iterStack = iterStack;
  context.vars = vars;
  return context;
};

const execute = (
  script: MachinatScript,
  begin: number,
  initialVars: Vars,
  previousIterStack?: IterStatus[]
): ExecuteResult => {
  const { _commands: commands } = script;

  let context: ExecuteContext = {
    stoppedAt: undefined,
    cursor: begin,
    content: [],
    vars: initialVars,
    iterStack: previousIterStack,
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
    } else if (command.type === 'iter_outset') {
      context = executeIterOutsetCommand(command, context);
    } else {
      throw new TypeError(`unknow command type ${command.type}`);
    }

    if (context.stoppedAt) {
      const {
        stoppedAt,
        content,
        vars,
        iterStack,
        descendantCallStack,
      } = context;
      const stackStatus = { script, vars, iterStack, at: stoppedAt };

      return {
        finished: false,
        content,
        stack: descendantCallStack
          ? [stackStatus, ...descendantCallStack]
          : [stackStatus],
      };
    }
  }

  return { finished: true, content: context.content, stack: undefined };
};

const run = (beginningStack: CallingStatus[], answer?: any): ExecuteResult => {
  const callingDepth = beginningStack.length;
  const content = [];

  for (let d = callingDepth - 1; d >= 0; d -= 1) {
    const stack = beginningStack[d];
    const { script, vars: beginningVars, at, iterStack } = stack;

    let index = at ? getCursorIndex(script, at) : 0;
    let vars = beginningVars;

    if (d === callingDepth - 1) {
      if (answer) {
        const waitingPrompt = script._commands[index];

        invariant(
          waitingPrompt && waitingPrompt.type === 'prompt',
          `stopped point "${at || ''}" is not a <Prompt/>, the key mapping of ${
            script.name
          } might have been changed`
        );

        vars = waitingPrompt.setter
          ? merge(vars, waitingPrompt.setter(vars, answer))
          : vars;
        index += 1;
      }
    } else {
      invariant(
        script._commands[index].type === 'call',
        `returned point "${at || ''}" is not a <Call/>, the key mapping of ${
          script.name
        } might have been changed`
      );

      index += 1;
    }

    const result = execute(script, index, vars, iterStack);
    content.push(...result.content);

    if (!result.finished) {
      return {
        finished: false,
        stack: [...beginningStack.slice(0, d), ...result.stack],
        content,
      };
    }
  }

  return {
    finished: true,
    stack: undefined,
    content,
  };
};

export default run;
