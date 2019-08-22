// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import type { MachinatNode } from 'machinat/types';
import type { MachinatScript, Vars, ScriptCallScope } from './types';

type FinishedExecuteResult = {
  finished: true,
  stack: void,
  content: MachinatNode[],
};

type UnfinishedExecuteResult = {
  finished: false,
  stack: ScriptCallScope[],
  content: MachinatNode[],
};

type ExecuteResult = FinishedExecuteResult | UnfinishedExecuteResult;

const merge = (...objs: Object[]) => Object.assign({}, ...objs);

const execute = (
  script: MachinatScript,
  initialVars: Vars,
  begin: number
): ExecuteResult => {
  const { _commands: commands, name } = script;

  let cursor = begin;
  let vars = initialVars;
  const content = [];

  while (cursor < commands.length) {
    const command = commands[cursor];
    cursor += 1;

    if (command.type === 'content') {
      content.push(command.render(vars));
    } else if (command.type === 'set_vars') {
      vars = merge(vars, command.setter(vars));
    } else if (command.type === 'jump') {
      cursor = command.index;
    } else if (command.type === 'jump_cond') {
      if (command.condition(vars) !== command.isNot) {
        cursor = command.index;
      }
    } else if (command.type === 'call') {
      const { script: subScript, key, withVars, gotoKey } = command;
      const result = initRuntime(
        subScript,
        withVars ? withVars(vars) : {},
        gotoKey
      );

      content.push(...result.content);

      if (!result.finished) {
        return {
          finished: false,
          content,
          stack: [{ name, vars, stoppedAt: key }, ...result.stack],
        };
      }
    } else if (command.type === 'prompt') {
      return {
        finished: false,
        stack: [{ name, vars, stoppedAt: command.key }],
        content,
      };
    } else {
      throw new Error('???????????/');
    }
  }

  return { finished: true, content, stack: undefined };
};

export const initRuntime = (
  script: MachinatScript,
  initialVars: Vars,
  key?: string
): ExecuteResult => {
  let begin = 0;
  if (key) {
    begin = script._keyMapping[key];
    invariant(begin !== undefined, `?????????????????/`);
  }

  return execute(script, initialVars, begin);
};

export const continueRuntime = (
  libraries: MachinatScript[],
  initialStack: ScriptCallScope[],
  frame: any
): ExecuteResult => {
  const content = [];

  for (let i = initialStack.length - 1; i >= 0; i -= 1) {
    const stack = initialStack[i];
    const { vars: initialVars, stoppedAt } = stack;
    let vars = initialVars;

    const script = libraries.find(lib => lib.name === stack.name);
    invariant(script, `?????????????????/`);

    let index = script._keyMapping[stoppedAt];
    invariant(index !== undefined, `??????????`);

    const currentCommand = script._commands[index];
    invariant(currentCommand, `?????????????????`);

    if (i === initialStack.length - 1) {
      invariant(currentCommand.type === 'prompt', `?????????????????`);

      vars = currentCommand.setter
        ? merge(vars, currentCommand.setter(vars, frame))
        : vars;
      index += 1;
    } else if (currentCommand.type === 'call') {
      index += 1;
    }

    const result = execute(script, vars, index);
    content.push(...result.content);

    if (!result.finished) {
      return {
        finished: false,
        stack: [...initialStack.slice(0, i), ...result.stack],
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
