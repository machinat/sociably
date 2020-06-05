// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { counter } from './utils';
import type {
  ConditionMatcher,
  ScriptSegment,
  ContentSegment,
  ConditionsSegment,
  WhileSegment,
  PromptSegment,
  CallSegment,
  SetVarsSegment,
  LabelSegment,
  ReturnSegment,
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
  condition: ConditionMatcher<Vars>,
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
  | CallCommand<any, any, any>
  | ReturnCommand<any>
  | GotoIntermediate
  | GotoCondIntermediate<any>
  | TagIntermediate;

type CompileResult<Vars, Input, RetrunValue> = {
  commands: ScriptCommand<Vars, Input, RetrunValue>[],
  entryKeysIndex: Map<string, number>,
};

const compileContentSegment = (
  segment: ContentSegment<any>
): CompileIntermediate[] => [{ type: 'content', render: segment.render }];

const compileConditionsSegment = (
  { branches, fallbackBody }: ConditionsSegment<any>,
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
  if (fallbackBody) {
    commands.push(...compileSegments(fallbackBody, uniqCounter));
  }

  commands.push(jumpToEnd, ...bodiesSections, endTag);
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
  escape,
  key,
}: PromptSegment<any, any>): CompileIntermediate[] => {
  return [
    { type: 'tag', key, isEntryPoint: true },
    { type: 'prompt', setter, escape, key },
  ];
};

const compileCallSegment = ({
  script,
  withVars,
  setter,
  key,
  goto,
}: CallSegment<any, any, any>): CompileIntermediate[] => {
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

const compileReturnSegment = ({
  valueGetter,
}: ReturnSegment<any>): CompileIntermediate[] => {
  return [{ type: 'return', valueGetter }];
};

const compileSegments = (
  segments: ScriptSegment<any, any, any>[],
  uniqCounter: () => number
): CompileIntermediate[] => {
  const commands: CompileIntermediate[] = [];

  for (const segment of segments) {
    const commandsFromSegment: ?(CompileIntermediate[]) =
      segment.type === 'content'
        ? compileContentSegment(segment)
        : segment.type === 'conditions'
        ? compileConditionsSegment(segment, uniqCounter)
        : segment.type === 'while'
        ? compileWhileSegment(segment, uniqCounter)
        : segment.type === 'prompt'
        ? compilePromptSegment(segment)
        : segment.type === 'call'
        ? compileCallSegment(segment)
        : segment.type === 'set_vars'
        ? compileSetVarsSegment(segment)
        : segment.type === 'label'
        ? compileLabelSegment(segment)
        : segment.type === 'return'
        ? compileReturnSegment(segment)
        : null;

    if (!commandsFromSegment) {
      throw TypeError(`unexpected segment type: ${segment.type}`);
    }

    commands.push(...commandsFromSegment);
  }

  return commands;
};

const compile = <Vars, Input, RetrunValue>(
  segments: ScriptSegment<Vars, Input, RetrunValue>[],
  meta: { scriptName: string }
): CompileResult<Vars, Input, RetrunValue> => {
  const intermediates = compileSegments(segments, counter());

  const keyIndex = new Map();
  const entryKeysIndex = new Map();

  // remove tags and store their indexes
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
        entryKeysIndex.set(key, mediateCommands.length);
      }
    } else {
      mediateCommands.push(intermediate);
    }
  }

  // translate "goto tag" to "jump index"
  const commands: ScriptCommand<Vars, Input, RetrunValue>[] = [];

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

  return { commands, entryKeysIndex };
};

export default compile;
