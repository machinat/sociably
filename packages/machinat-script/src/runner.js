// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import type { MachinatNode } from 'machinat/types';
import type { MachinatScript, Vars, CallingStatus } from './types';

export const merge = (...objs: Object[]) => Object.assign({}, ...objs);

export const getCursorIndex = (script: MachinatScript, key: string): number => {
  const index = script._keyMapping.get(key);

  invariant(index !== undefined, `?????????????????????`);

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

const execute = (
  script: MachinatScript,
  initialVars: Vars,
  begin: number
): ExecuteResult => {
  const { _commands: commands } = script;

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
      cursor += command.offset - 1;
    } else if (command.type === 'jump_cond') {
      if (command.condition(vars) !== command.isNot) {
        cursor += command.offset - 1;
      }
    } else if (command.type === 'prompt') {
      return {
        finished: false,
        stack: [{ script, vars, at: command.key }],
        content,
      };
    } else if (command.type === 'call') {
      const { script: subScript, key, withVars, gotoKey } = command;
      const index = gotoKey ? getCursorIndex(subScript, gotoKey) : 0;

      const result = execute(subScript, withVars ? withVars(vars) : {}, index);
      content.push(...result.content);

      if (!result.finished) {
        return {
          finished: false,
          content,
          stack: [{ script, vars, at: key }, ...result.stack],
        };
      }
    } else {
      throw new Error('???????????/');
    }
  }

  return { finished: true, content, stack: undefined };
};

const run = (beginningStack: CallingStatus[], answer?: any): ExecuteResult => {
  const callingDepth = beginningStack.length;
  const content = [];

  for (let d = callingDepth - 1; d >= 0; d -= 1) {
    const stack = beginningStack[d];
    const { script, vars: beginningVars, at } = stack;

    let index = at ? getCursorIndex(script, at) : 0;
    let vars = beginningVars;

    if (d === callingDepth - 1) {
      if (answer) {
        const waitingPrompt = script._commands[index];

        invariant(
          waitingPrompt && waitingPrompt.type === 'prompt',
          `?????????????????`
        );

        vars = waitingPrompt.setter
          ? merge(vars, waitingPrompt.setter(vars, answer))
          : vars;
        index += 1;
      }
    } else {
      invariant(
        script._commands[index].type === 'call',
        `???????????????????????`
      );

      index += 1;
    }

    const result = execute(script, vars, index);
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
