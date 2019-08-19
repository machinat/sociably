// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import type { MachinatNode } from 'machinat/types';
import type { MachinatScriptType, Vars, ScriptCallScope } from './types';

type FinishedExecuteResult = {
  finished: true,
  stack: void,
  messages: MachinatNode[],
};

type UnfinishedExecuteResult = {
  finished: false,
  stack: ScriptCallScope[],
  messages: MachinatNode[],
};

type ExecuteResult = FinishedExecuteResult | UnfinishedExecuteResult;

const merge = (...objs: Object[]) => Object.assign(...objs);

const execute = (
  script: MachinatScriptType,
  initialVars: Vars,
  begin: number
): ExecuteResult => {
  const { _commands: commands, name } = script;

  let cursor = begin;
  let vars = initialVars;
  const messages = [];

  while (cursor < commands.length) {
    const command = commands[cursor];

    if (command.type === 'messages') {
      messages.push(command.render(vars));
    } else if (command.type === 'set_vars') {
      vars = merge(vars, command.setter(vars));
    } else if (command.type === 'jump') {
      cursor = command.index;
    } else if (command.type === 'jump_cond') {
      if (command.condition(vars) !== command.isNot) {
        cursor = command.index;
      }
    } else if (command.type === 'call') {
      const result = initRuntime(command.script, command.vars, command.gotoKey);

      messages.push(...result.messages);

      if (!result.finished) {
        return {
          finished: false,
          messages,
          stack: [{ name, vars, stopping: cursor }, ...result.stack],
        };
      }
    } else if (command.type === 'prompt') {
      return {
        finished: false,
        messages,
        stack: [{ name, vars, stopping: cursor }],
      };
    }
  }

  return { finished: true, messages, stack: undefined };
};

export const initRuntime = (
  script: MachinatScriptType,
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
  libraries: MachinatScriptType[],
  initialStack: ScriptCallScope[],
  frame: any
): ExecuteResult => {
  const messages = [];

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
    messages.push(...result.messages);

    if (!result.finished) {
      return {
        finished: false,
        messages,
        stack: [...initialStack.slice(0, i), ...result.stack],
      };
    }
  }

  return {
    finished: true,
    messages,
    stack: undefined,
  };
};
