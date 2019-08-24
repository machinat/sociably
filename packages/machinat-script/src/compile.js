// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { counter } from './utils';
import type {
  Vars,
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

export type ForOutsetIntermediate = {|
  type: 'for_outset',
  iterName: string,
  getIterable: Vars => Iterator<any>,
  varName?: string,
  ending: string,
|};

type CompileIntermediate =
  | ContentCommand
  | PromptCommand
  | SetVarsCommand
  | CallCommand
  | GotoIntermediate
  | GotoCondIntermediate
  | LabelIntermediate
  | ForOutsetIntermediate;

type CompileResult = {
  commands: ScriptCommand[],
  keyMapping: Map<string, number>,
};

const compileContentSegment = (
  segment: ContentSegment
): CompileIntermediate[] => [{ type: 'content', render: segment.render }];

const compileIfSegment = (
  segment: IfSegment,
  countIdentifier: () => number
): CompileIntermediate[] => {
  const { branches, fallback, key } = segment;
  const n: number = countIdentifier();

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

    bodies.push(label, ...compileSegments(body, countIdentifier), jumpToEnd);
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
    commands.push(...compileSegments(fallback, countIdentifier), jumpToEnd);
  }

  commands.push(...bodies, endLabel);
  return commands;
};

const compileWhileSegment = (
  segment: WhileSegment,
  countIdentifier: () => number
): CompileIntermediate[] => {
  const { condition, body, key } = segment;
  const n: number = countIdentifier();

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
    ...compileSegments(body, countIdentifier),
    {
      type: 'goto',
      to: startLabel.name,
    },
    endLabel,
  ];
};

const compileForSegment = (
  segment: ForSegment,
  countIdentifier: () => number
): CompileIntermediate[] => {
  const n: number = countIdentifier();
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
      type: 'for_outset',
      iterName,
      getIterable,
      varName,
      ending: endLabel.name,
    },
    ...compileSegments(body, countIdentifier),
    {
      type: 'goto',
      to: startLabel.name,
    },
    endLabel,
  ];
};

const compilePromptSegment = (
  segment: PromptSegment,
  countIdentifier: () => number
): CompileIntermediate[] => {
  const n: number = countIdentifier();

  const { setter, key } = segment;
  return [
    { type: 'label', name: `prompt_${n}`, key },
    { type: 'prompt', setter, key },
  ];
};

const compileCallSegment = (
  segment: CallSegment,
  countIdentifier: () => number
): CompileIntermediate[] => {
  const n: number = countIdentifier();

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
  countIdentifier: () => number
): CompileIntermediate[] => {
  const n: number = countIdentifier();
  return [{ type: 'label', name: `label_${n}`, key: segment.key }];
};

const compileSegments = (
  segments: ScriptSegment[],
  countIdentifier: () => number
): CompileIntermediate[] => {
  const commands = [];

  for (const segment of segments) {
    if (segment.type === 'content') {
      commands.push(...compileContentSegment(segment));
    } else if (segment.type === 'if') {
      commands.push(...compileIfSegment(segment, countIdentifier));
    } else if (segment.type === 'for') {
      commands.push(...compileForSegment(segment, countIdentifier));
    } else if (segment.type === 'while') {
      commands.push(...compileWhileSegment(segment, countIdentifier));
    } else if (segment.type === 'prompt') {
      commands.push(...compilePromptSegment(segment, countIdentifier));
    } else if (segment.type === 'call') {
      commands.push(...compileCallSegment(segment, countIdentifier));
    } else if (segment.type === 'set_vars') {
      commands.push(...compileSetVarsSegment(segment));
    } else if (segment.type === 'label') {
      commands.push(...compileLabelSegment(segment, countIdentifier));
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
    } else if (command.type === 'for_outset') {
      const { iterName, getIterable, varName, ending } = command;
      const targetIdx = labelMapping.get(ending);
      invariant(targetIdx !== undefined, `??????????????`);

      commands.push({
        type: 'iter_outset',
        iterName,
        getIterable,
        varName,
        endingOffset: targetIdx - idx,
      });
    } else {
      commands.push(command);
    }
  }

  return { commands, keyMapping };
};

export default compile;
