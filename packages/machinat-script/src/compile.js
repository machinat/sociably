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
  PromptSegment,
  CallSegment,
  SetVarsSegment,
  LabelSegment,
  ContentCommand,
  PromptCommand,
  SetVarsCommand,
  CallCommand,
  ReturnCommand,
  ScriptCommand,
} from './types';

type GotoIntermediate = {|
  type: 'goto',
  to: string,
|};

type GotoCondIntermediate<Vars> = {|
  type: 'goto_cond',
  to: string,
  condition: VarsMatcher<Vars>,
  isNot: boolean,
|};

type TagIntermediate = {|
  type: 'tag',
  key: string,
  isEntryPoint: boolean,
|};

type CompileIntermediate =
  | ContentCommand<any>
  | PromptCommand<any, any>
  | SetVarsCommand<any>
  | CallCommand<any, any>
  | ReturnCommand
  | GotoIntermediate
  | GotoCondIntermediate<any>
  | TagIntermediate;

type CompileResult<Vars, Input> = {
  commands: ScriptCommand<Vars, Input>[],
  entryPointIndex: Map<string, number>,
};

const compileContentSegment = (
  segment: ContentSegment<any>
): CompileIntermediate[] => [{ type: 'content', render: segment.render }];

const compileIfSegment = (
  { branches, fallback }: IfSegment<any>,
  uniqCounter: () => number
): CompileIntermediate[] => {
  const n: number = uniqCounter();

  const endTag = {
    type: 'tag',
    key: `end_if_${n}`,
    isEntryPoint: false,
  };

  const jumpToEnd = {
    type: 'goto',
    to: endTag.key,
  };

  const conditionsSection: CompileIntermediate[] = [];
  const bodiesSections: CompileIntermediate[] = [];

  for (const [i, { condition, body }] of branches.entries()) {
    const bodyBeginTag = {
      type: 'tag',
      key: `if_${n}_branch_${i}`,
      isEntryPoint: false,
    };

    conditionsSection.push({
      type: 'goto_cond',
      to: bodyBeginTag.key,
      condition,
      isNot: false,
    });

    bodiesSections.push(
      bodyBeginTag,
      ...compileSegments(body, uniqCounter),
      jumpToEnd
    );
  }

  const commands: CompileIntermediate[] = [...conditionsSection];
  if (fallback) {
    commands.push(...compileSegments(fallback, uniqCounter), jumpToEnd);
  }

  commands.push(...bodiesSections, endTag);
  return commands;
};

const compileWhileSegment = (
  { condition, body }: WhileSegment<any>,
  uniqCounter: () => number
): CompileIntermediate[] => {
  const n: number = uniqCounter();

  const startTag = {
    type: 'tag',
    key: `while_${n}`,
    isEntryPoint: false,
  };

  const endTag = {
    type: 'tag',
    key: `end_while_${n}`,
    isEntryPoint: false,
  };

  return [
    startTag,
    {
      type: 'goto_cond',
      condition,
      isNot: true,
      to: endTag.key,
    },
    ...compileSegments(body, uniqCounter),
    {
      type: 'goto',
      to: startTag.key,
    },
    endTag,
  ];
};

const compilePromptSegment = ({
  setter,
  key,
}: PromptSegment<any>): CompileIntermediate[] => {
  return [
    { type: 'tag', key, isEntryPoint: true },
    { type: 'prompt', setter, key },
  ];
};

const compileCallSegment = ({
  script,
  withVars,
  setter,
  key,
  goto,
}: CallSegment<any, any>): CompileIntermediate[] => {
  return [
    { type: 'tag', key, isEntryPoint: true },
    { type: 'call', script, withVars, setter, goto, key },
  ];
};

const compileSetVarsSegment = (
  segment: SetVarsSegment<any>
): CompileIntermediate[] => {
  const { setter } = segment;
  return [{ type: 'set_vars', setter }];
};

const compileLabelSegment = ({ key }: LabelSegment): CompileIntermediate[] => {
  return [{ type: 'tag', key, isEntryPoint: true }];
};

const compileSegments = (
  segments: ScriptSegment<any>[],
  uniqCounter: () => number
): CompileIntermediate[] => {
  const commands = [];

  for (const segment of segments) {
    if (segment.type === 'content') {
      commands.push(...compileContentSegment(segment));
    } else if (segment.type === 'if') {
      commands.push(...compileIfSegment(segment, uniqCounter));
    } else if (segment.type === 'while') {
      commands.push(...compileWhileSegment(segment, uniqCounter));
    } else if (segment.type === 'prompt') {
      commands.push(...compilePromptSegment(segment));
    } else if (segment.type === 'call') {
      commands.push(...compileCallSegment(segment));
    } else if (segment.type === 'set_vars') {
      commands.push(...compileSetVarsSegment(segment));
    } else if (segment.type === 'label') {
      commands.push(...compileLabelSegment(segment));
    } else if (segment.type === 'return') {
      commands.push({ type: 'return' });
    } else {
      throw TypeError(`unexpected segment type: ${segment.type}`);
    }
  }

  return commands;
};

const compile = <Vars, Input>(
  segments: ScriptSegment<Vars>[],
  meta: { scriptName: string }
): CompileResult<Vars, Input> => {
  const intermediates = compileSegments(segments, counter());

  const keyIndex = new Map();
  const entryPointIndex = new Map();

  // remove labels and store their indexes
  const mediateCommands = [];
  for (const intermediate of intermediates) {
    if (intermediate.type === 'tag') {
      const { isEntryPoint, key } = intermediate;
      invariant(
        !keyIndex.has(key),
        `key "${key}" duplicated in ${meta.scriptName}`
      );

      keyIndex.set(key, mediateCommands.length);
      if (isEntryPoint) {
        entryPointIndex.set(key, mediateCommands.length);
      }
    } else {
      mediateCommands.push(intermediate);
    }
  }

  // translate "goto tag" to "jump index"
  const commands: ScriptCommand<Vars, Input>[] = [];
  for (const [idx, command] of mediateCommands.entries()) {
    if (command.type === 'goto') {
      const targetIdx = keyIndex.get(command.to);
      invariant(targetIdx !== undefined, `label "${command.to}" not found`);

      commands.push({
        type: 'jump',
        offset: targetIdx - idx,
      });
    } else if (command.type === 'goto_cond') {
      const { to, condition, isNot } = command;
      const targetIdx = keyIndex.get(to);
      invariant(targetIdx !== undefined, `label "${to}" not found`);

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

  return { commands, entryPointIndex };
};

export default compile;
