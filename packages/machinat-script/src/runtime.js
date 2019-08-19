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

const merge = (...objs: Object[]) => Object.assign(...objs);

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
      const { script: subScript, withVars, gotoKey } = command;
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
          stack: [{ name, vars, stopping: cursor }, ...result.stack],
        };
      }
    } else if (command.type === 'prompt') {
      return {
        finished: false,
        content,
        stack: [{ name, vars, stopping: cursor }],
      };
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
    let { vars, stopping } = stack;

    const script = libraries.find(lib => lib.name === stack.name);
    invariant(script, `?????????????????/`);

    const currentCommand = script._commands[stopping];
    invariant(currentCommand, `?????????????????`);

    if (i === initialStack.length) {
      invariant(currentCommand.type === 'prompt', `?????????????????`);

      vars = currentCommand.setter
        ? merge(vars, currentCommand.setter(vars, frame))
        : vars;
      stopping += 1;
    } else if (currentCommand.type === 'call') {
      stopping += 1;
    }

    const result = execute(script, vars, stopping);
    content.push(...result.content);

    if (!result.finished) {
      return {
        finished: false,
        content,
        stack: [...initialStack.slice(0, i), ...result.stack],
      };
    }
  }

  return {
    finished: true,
    content,
    stack: undefined,
  };
};
