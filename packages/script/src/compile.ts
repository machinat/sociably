/** @internal */ /** */
/* eslint @typescript-eslint/no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { createCounter } from './utils';
import type {
  ConditionMatcher,
  ScriptSegment,
  ConditionsSegment,
  WhileSegment,
  LabelSegment,
  ContentCommand,
  PromptCommand,
  VarsCommand,
  EffectCommand,
  CallCommand,
  ReturnCommand,
  ScriptCommand,
} from './types';

type GotoIntermediate = {
  type: 'goto';
  to: string;
};

type GotoCondIntermediate<Vars> = {
  type: 'goto_cond';
  to: string;
  condition: ConditionMatcher<Vars>;
  isNot: boolean;
};

type TagIntermediate = {
  type: 'tag';
  key: string;
  isEntryPoint: boolean;
};

type CompileIntermediate =
  | ContentCommand<unknown>
  | PromptCommand<unknown, unknown>
  | VarsCommand<unknown>
  | EffectCommand<unknown>
  | CallCommand<unknown, unknown, unknown>
  | ReturnCommand<unknown, unknown>
  | GotoIntermediate
  | GotoCondIntermediate<unknown>
  | TagIntermediate;

type CompileResult<Vars, Input, Retrun> = {
  commands: ScriptCommand<Vars, Input, Retrun>[];
  stopPointIndex: Map<string, number>;
};

const compileContentCommand = (
  command: ContentCommand<unknown>
): CompileIntermediate[] => [command];

const compileConditionsSegment = (
  { branches, fallbackBody }: ConditionsSegment<unknown>,
  uniqCounter: () => number
): CompileIntermediate[] => {
  const n: number = uniqCounter();

  const endTag = {
    type: 'tag' as const,
    key: `end_if_${n}`,
    isEntryPoint: false,
  };

  const jumpToEnd = {
    type: 'goto' as const,
    to: endTag.key,
  };

  const conditionsSection: CompileIntermediate[] = [];
  const bodiesSections: CompileIntermediate[] = [];

  for (const [i, { condition, body }] of branches.entries()) {
    const bodyBeginTag = {
      type: 'tag' as const,
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
  if (fallbackBody) {
    commands.push(...compileSegments(fallbackBody, uniqCounter));
  }

  commands.push(jumpToEnd, ...bodiesSections, endTag);
  return commands;
};

const compileWhileSegment = (
  { condition, body }: WhileSegment<unknown>,
  uniqCounter: () => number
): CompileIntermediate[] => {
  const n: number = uniqCounter();

  const startTag = {
    type: 'tag' as const,
    key: `while_${n}`,
    isEntryPoint: false,
  };

  const endTag = {
    type: 'tag' as const,
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

const compilePromptCommand = ({
  setVars,
  key,
}: PromptCommand<unknown, unknown>): CompileIntermediate[] => {
  return [
    { type: 'tag', key, isEntryPoint: true },
    { type: 'prompt', setVars, key },
  ];
};

const compileCallCommand = ({
  script,
  withVars,
  setVars,
  key,
  goto,
}: CallCommand<unknown, unknown, unknown>): CompileIntermediate[] => {
  return [
    { type: 'tag', key, isEntryPoint: true },
    { type: 'call', script, withVars, setVars, goto, key },
  ];
};

const compileVarsCommand = (
  command: VarsCommand<unknown>
): CompileIntermediate[] => [command];

const compileEffectCommand = (
  command: EffectCommand<unknown>
): CompileIntermediate[] => [command];

const compileLabelSegment = ({ key }: LabelSegment): CompileIntermediate[] => {
  return [{ type: 'tag', key, isEntryPoint: true }];
};

const compileReturnCommand = ({
  getValue,
}: ReturnCommand<unknown, unknown>): CompileIntermediate[] => {
  return [{ type: 'return', getValue }];
};

const compileSegment = <Vars, Input, Retrun>(
  segment: ScriptSegment<Vars, Input, Retrun>,
  uniqCounter: () => number
): CompileIntermediate[] => {
  switch (segment.type) {
    case 'content':
      return compileContentCommand(segment);
    case 'conditions':
      return compileConditionsSegment(segment, uniqCounter);
    case 'while':
      return compileWhileSegment(segment, uniqCounter);
    case 'prompt':
      return compilePromptCommand(segment);
    case 'call':
      return compileCallCommand(segment);
    case 'vars':
      return compileVarsCommand(segment);
    case 'effect':
      return compileEffectCommand(segment);
    case 'label':
      return compileLabelSegment(segment);
    case 'return':
      return compileReturnCommand(segment);
    default:
      throw new TypeError(
        `unknown segment type: ${
          (segment as ScriptSegment<Vars, Input, Retrun>).type
        }`
      );
  }
};

const compileSegments = <Vars, Input, Retrun>(
  segments: ScriptSegment<Vars, Input, Retrun>[],
  counter: () => number
) =>
  segments.reduce(
    (compilingArray, segment) => [
      ...compilingArray,
      ...compileSegment(segment, counter),
    ],
    []
  );

const compile = <Vars, Input, Return>(
  segments: ScriptSegment<Vars, Input, Return>[],
  meta: { scriptName: string }
): CompileResult<Vars, Input, Return> => {
  const keyIndex = new Map();
  const stopPointIndex = new Map();

  // remove tags and store their indexes
  const mediateCommands: Exclude<CompileIntermediate, TagIntermediate>[] = [];
  const compiledIntermediates = compileSegments(segments, createCounter());

  for (const intermediate of compiledIntermediates) {
    if (intermediate.type === 'tag') {
      const { isEntryPoint, key } = intermediate;

      invariant(
        !keyIndex.has(key),
        `key "${key}" duplicated in ${meta.scriptName}`
      );

      keyIndex.set(key, mediateCommands.length);
      if (isEntryPoint) {
        stopPointIndex.set(key, mediateCommands.length);
      }
    } else {
      mediateCommands.push(intermediate);
    }
  }

  // translate "goto tag" to "jump index"
  const commands: ScriptCommand<unknown, unknown, unknown>[] = [];

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

  return {
    commands: commands as ScriptCommand<Vars, Input, Return>[],
    stopPointIndex,
  };
};

export default compile;
