// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { counter } from './utils';
import type {
  VarsMatcher,
  ScriptSegment,
  ContentSegment,
  IfSegment,
  WhileSegment,
  ForSegment,
  PromptSegment,
  CallSegment,
  SetVarsSegment,
  LabelSegment,
  ContentCommand,
  PromptCommand,
  SetVarsCommand,
  CallCommand,
  ScriptCommand,
} from './types';

type GotoIntermediate = {|
  type: 'goto',
  to: string,
|};

type GotoCondIntermediate = {|
  type: 'goto_cond',
  to: string,
  condition: VarsMatcher,
  isNot: boolean,
|};

type LabelIntermediate = {|
  type: 'label',
  name: string,
  key?: string,
|};

type CompileIntermediate =
  | ContentCommand
  | PromptCommand
  | SetVarsCommand
  | CallCommand
  | GotoIntermediate
  | GotoCondIntermediate
  | LabelIntermediate;

type CompileResult = {
  commands: ScriptCommand[],
  keyMapping: Map<string, number>,
};

const compileContentSegment = (
  segment: ContentSegment
): CompileIntermediate[] => [{ type: 'content', render: segment.render }];

const compileIfSegment = (
  segment: IfSegment,
  countLabel: () => number
): CompileIntermediate[] => {
  const { branches, fallback, key } = segment;
  const n: number = countLabel();

  const endLabel = {
    type: 'label',
    name: `end_if_${n}`,
  };

  const jumpToEnd = {
    type: 'goto',
    to: endLabel.name,
  };

  const branchings: CompileIntermediate[] = [];
  const bodies: CompileIntermediate[] = [];

  for (const [i, { condition, body }] of branches.entries()) {
    const label = {
      type: 'label',
      name: `if_${n}_branch_${i}`,
    };

    branchings.push({
      type: 'goto_cond',
      to: label.name,
      condition,
      isNot: false,
    });

    bodies.push(label, ...compileSegments(body, countLabel), jumpToEnd);
  }

  const commands: CompileIntermediate[] = [];

  if (key) {
    commands.push({
      type: 'label',
      name: `if_${n}`,
      key,
    });
  }

  commands.push(...branchings);

  if (fallback) {
    commands.push(...compileSegments(fallback, countLabel), jumpToEnd);
  }

  commands.push(...bodies, endLabel);
  return commands;
};

const compileWhileSegment = (
  segment: WhileSegment,
  countLabel: () => number
): CompileIntermediate[] => {
  const { condition, body, key } = segment;
  const n: number = countLabel();

  const startLabel = {
    type: 'label',
    name: `while_${n}`,
    key,
  };

  const endLabel = {
    type: 'label',
    name: `end_while_${n}`,
  };

  return [
    startLabel,
    {
      type: 'goto_cond',
      condition,
      isNot: true,
      to: endLabel.name,
    },
    ...compileSegments(body, countLabel),
    {
      type: 'goto',
      to: startLabel.name,
    },
    endLabel,
  ];
};

const compileForSegment = (
  segment: ForSegment,
  countLabel: () => number
): CompileIntermediate[] => {
  const n: number = countLabel();
  const { getIterable, body, varName } = segment;

  const iterName = `for_${n}`;

  const startLabel = {
    type: 'label',
    name: iterName,
    key: segment.key,
  };

  const endLabel = {
    type: 'label',
    name: `end_for_${n}`,
  };

  return [
    startLabel,
    {
      type: 'set_vars',
      setter(vars) {
        let iterStack = vars.$iterStack;

        if (!iterStack) {
          iterStack = [
            {
              index: 0,
              items: [...getIterable(vars)],
              name: iterName,
            },
          ];
        } else if (iterStack[iterStack.length - 1].name !== iterName) {
          iterStack.push({
            index: 0,
            items: [...getIterable(vars)],
            name: iterName,
          });
        } else {
          iterStack[iterStack.length - 1].index += 1;
        }

        if (varName) {
          const { index, items } = iterStack[iterStack.length - 1];
          return { ...vars, $iterStack: iterStack, [varName]: items[index] };
        }

        return { ...vars, $iterStack: iterStack };
      },
    },
    {
      type: 'goto_cond',
      condition: ({ $iterStack }) => {
        const { index, items } = $iterStack[$iterStack.length - 1];
        return index < items.length;
      },
      isNot: true,
      to: endLabel.name,
    },
    ...compileSegments(body, countLabel),
    {
      type: 'goto',
      to: startLabel.name,
    },
    endLabel,
    {
      type: 'set_vars',
      setter(vars) {
        const iterStack = vars.$iterStack.slice(0, -1);
        return {
          ...vars,
          $iterStack: iterStack.length === 0 ? undefined : iterStack,
        };
      },
    },
  ];
};

const compilePromptSegment = (
  segment: PromptSegment,
  countLabel: () => number
): CompileIntermediate[] => {
  const n: number = countLabel();

  const { setter, key } = segment;
  return [
    { type: 'label', name: `prompt_${n}`, key },
    { type: 'prompt', setter, key },
  ];
};

const compileCallSegment = (
  segment: CallSegment,
  countLabel: () => number
): CompileIntermediate[] => {
  const n: number = countLabel();

  const { script, withVars, key, gotoKey } = segment;
  return [
    { type: 'label', name: `call_${n}`, key },
    { type: 'call', script, withVars, gotoKey, key },
  ];
};

const compileSetVarsSegment = (
  segment: SetVarsSegment
): CompileIntermediate[] => {
  const { setter } = segment;
  return [{ type: 'set_vars', setter }];
};

const compileLabelSegment = (
  segment: LabelSegment,
  countLabel: () => number
): CompileIntermediate[] => {
  const n: number = countLabel();
  return [{ type: 'label', name: `label_${n}`, key: segment.key }];
};

const compileSegments = (
  segments: ScriptSegment[],
  countLabel: () => number
): CompileIntermediate[] => {
  const commands = [];

  for (const segment of segments) {
    if (segment.type === 'content') {
      commands.push(...compileContentSegment(segment));
    } else if (segment.type === 'if') {
      commands.push(...compileIfSegment(segment, countLabel));
    } else if (segment.type === 'for') {
      commands.push(...compileForSegment(segment, countLabel));
    } else if (segment.type === 'while') {
      commands.push(...compileWhileSegment(segment, countLabel));
    } else if (segment.type === 'prompt') {
      commands.push(...compilePromptSegment(segment, countLabel));
    } else if (segment.type === 'call') {
      commands.push(...compileCallSegment(segment, countLabel));
    } else if (segment.type === 'set_vars') {
      commands.push(...compileSetVarsSegment(segment));
    } else if (segment.type === 'label') {
      commands.push(...compileLabelSegment(segment, countLabel));
    } else {
      throw TypeError(`unexpected segment type: ${segment.type}`);
    }
  }

  return commands;
};

const compile = (segments: ScriptSegment[]): CompileResult => {
  const intermediates = compileSegments(segments, counter());

  const keyMapping = new Map();
  const labelMapping = new Map();

  // remove labels and store their indexes
  const mediateCommands = [];
  for (const intermediate of intermediates) {
    if (intermediate.type === 'label') {
      const { name, key } = intermediate;

      invariant(!labelMapping.has(name), `????????????`);
      labelMapping.set(name, mediateCommands.length);
      if (key) {
        invariant(!keyMapping.has(key), `????????????`);
        keyMapping.set(key, mediateCommands.length);
      }
    } else {
      mediateCommands.push(intermediate);
    }
  }

  // translate "goto tag" to "jump index"
  const commands: ScriptCommand[] = [];
  for (const [idx, command] of mediateCommands.entries()) {
    if (command.type === 'goto') {
      const targetIdx = labelMapping.get(command.to);
      invariant(targetIdx !== undefined, `??????????????`);

      commands.push({
        type: 'jump',
        offset: targetIdx - idx,
      });
    } else if (command.type === 'goto_cond') {
      const { to, condition, isNot } = command;
      const targetIdx = labelMapping.get(to);
      invariant(targetIdx !== undefined, `??????????????`);

      commands.push({
        type: 'jump_cond',
        offset: targetIdx - idx,
        condition,
        isNot,
      });
    } else {
      commands.push(command);
    }
  }

  return { commands, keyMapping };
};

export default compile;
