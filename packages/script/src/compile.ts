/** @internal */ /** */
/* eslint @typescript-eslint/no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { counter } from './utils';
import type {
  ConditionMatcher,
  ScriptIntermediate,
  ConditionsIntermediate,
  WhileIntermediate,
  LabelIntermediate,
  ContentCommand,
  PromptCommand,
  SetVarsCommand,
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
  | SetVarsCommand<unknown>
  | CallCommand<unknown, unknown, unknown>
  | ReturnCommand<unknown, unknown>
  | GotoIntermediate
  | GotoCondIntermediate<unknown>
  | TagIntermediate;

type CompileResult<Vars, Input, Retrun> = {
  commands: ScriptCommand<Vars, Input, Retrun>[];
  entriesIndex: Map<string, number>;
};

const compileContentCommand = (
  intermediate: ContentCommand<unknown>
): CompileIntermediate[] => [{ type: 'content', render: intermediate.render }];

const compileConditionsIntermediate = (
  { branches, fallbackBody }: ConditionsIntermediate<unknown>,
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
      ...compileIntermediates(body, uniqCounter),
      jumpToEnd
    );
  }

  const commands: CompileIntermediate[] = [...conditionsSection];
  if (fallbackBody) {
    commands.push(...compileIntermediates(fallbackBody, uniqCounter));
  }

  commands.push(jumpToEnd, ...bodiesSections, endTag);
  return commands;
};

const compileWhileIntermediate = (
  { condition, body }: WhileIntermediate<unknown>,
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
    ...compileIntermediates(body, uniqCounter),
    {
      type: 'goto',
      to: startTag.key,
    },
    endTag,
  ];
};

const compilePromptCommand = ({
  setter,
  key,
}: PromptCommand<unknown, unknown>): CompileIntermediate[] => {
  return [
    { type: 'tag', key, isEntryPoint: true },
    { type: 'prompt', setter, key },
  ];
};

const compileCallCommand = ({
  script,
  withVars,
  setter,
  key,
  goto,
}: CallCommand<unknown, unknown, unknown>): CompileIntermediate[] => {
  return [
    { type: 'tag', key, isEntryPoint: true },
    { type: 'call', script, withVars, setter, goto, key },
  ];
};

const compileSetVarsCommand = (
  intermediate: SetVarsCommand<unknown>
): CompileIntermediate[] => {
  const { setter } = intermediate;
  return [{ type: 'set_vars', setter }];
};

const compileLabelIntermediate = ({
  key,
}: LabelIntermediate): CompileIntermediate[] => {
  return [{ type: 'tag', key, isEntryPoint: true }];
};

const compileReturnCommand = ({
  valueGetter,
}: ReturnCommand<unknown, unknown>): CompileIntermediate[] => {
  return [{ type: 'return', valueGetter }];
};

const compileIntermediates = <Vars, Input, Retrun>(
  intermediates: ScriptIntermediate<Vars, Input, Retrun>[],
  uniqCounter: () => number
): CompileIntermediate[] => {
  const commands: CompileIntermediate[] = [];

  for (const intermediate of intermediates) {
    const commandsFromSegment: CompileIntermediate[] | null =
      intermediate.type === 'content'
        ? compileContentCommand(intermediate)
        : intermediate.type === 'conditions'
        ? compileConditionsIntermediate(intermediate, uniqCounter)
        : intermediate.type === 'while'
        ? compileWhileIntermediate(intermediate, uniqCounter)
        : intermediate.type === 'prompt'
        ? compilePromptCommand(intermediate)
        : intermediate.type === 'call'
        ? compileCallCommand(intermediate)
        : intermediate.type === 'set_vars'
        ? compileSetVarsCommand(intermediate)
        : intermediate.type === 'label'
        ? compileLabelIntermediate(intermediate)
        : intermediate.type === 'return'
        ? compileReturnCommand(intermediate)
        : null;

    if (!commandsFromSegment) {
      throw TypeError(`unexpected intermediate type: ${intermediate.type}`);
    }

    commands.push(...commandsFromSegment);
  }

  return commands;
};

const compile = <Vars, Input, Return>(
  intermediates: ScriptIntermediate<Vars, Input, Return>[],
  meta: { scriptName: string }
): CompileResult<Vars, Input, Return> => {
  const keyIndex = new Map();
  const entriesIndex = new Map();

  // remove tags and store their indexes
  const mediateCommands: Exclude<CompileIntermediate, TagIntermediate>[] = [];

  for (const intermediate of compileIntermediates(intermediates, counter())) {
    if (intermediate.type === 'tag') {
      const { isEntryPoint, key } = intermediate;

      invariant(
        !keyIndex.has(key),
        `key "${key}" duplicated in ${meta.scriptName}`
      );

      keyIndex.set(key, mediateCommands.length);
      if (isEntryPoint) {
        entriesIndex.set(key, mediateCommands.length);
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
    entriesIndex,
  };
};

export default compile;
