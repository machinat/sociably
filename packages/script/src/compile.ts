/* eslint @typescript-eslint/no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { createCounter } from './utils.js';
import type {
  ConditionMatcher,
  ScriptAstNode,
  ConditionsAstNode,
  WhileAstNode,
  LabelAstNode,
  GotoAstNode,
  ContentCommand,
  PromptCommand,
  EffectCommand,
  CallCommand,
  ReturnCommand,
  ScriptCommand,
} from './types.js';

type GotoCondMediateNode<Vars, Meta> = {
  type: 'goto_cond';
  to: string;
  condition: ConditionMatcher<Vars, Meta>;
  isNot: boolean;
};

type TagMediateNode = {
  type: 'tag';
  key: string;
  isEntryPoint: boolean;
};

type CompileMediateNode =
  | GotoAstNode
  | TagMediateNode
  | GotoCondMediateNode<unknown, unknown>
  | ContentCommand<unknown, unknown>
  | PromptCommand<unknown, unknown, unknown>
  | EffectCommand<unknown, unknown, unknown>
  | CallCommand<unknown, unknown, unknown, unknown, unknown>
  | ReturnCommand<unknown, unknown, unknown>;

type CompileResult<Vars, Input, Retrun, Yield, Meta> = {
  commands: ScriptCommand<Vars, Input, Retrun, Yield, Meta>[];
  stopPointIndex: Map<string, number>;
};

const compileContentCommand = (
  command: ContentCommand<unknown, unknown>,
): CompileMediateNode[] => [command];

const compileConditionsAstNode = (
  { branches, fallbackBody }: ConditionsAstNode<unknown, unknown>,
  uniqIndexCounter: () => number,
): CompileMediateNode[] => {
  const n: number = uniqIndexCounter();

  const endTag = {
    type: 'tag' as const,
    key: `end_if_${n}`,
    isEntryPoint: false,
  };

  const jumpToEnd = {
    type: 'goto' as const,
    key: endTag.key,
  };

  const conditionsSection: CompileMediateNode[] = [];
  const bodiesSections: CompileMediateNode[] = [];

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
      ...compileAstNodes(body, uniqIndexCounter),
      jumpToEnd,
    );
  }

  const commands: CompileMediateNode[] = [...conditionsSection];
  if (fallbackBody) {
    commands.push(...compileAstNodes(fallbackBody, uniqIndexCounter));
  }

  commands.push(jumpToEnd, ...bodiesSections, endTag);
  return commands;
};

const compileWhileAstNode = (
  { condition, body }: WhileAstNode<unknown, unknown>,
  uniqIndexCounter: () => number,
): CompileMediateNode[] => {
  const n: number = uniqIndexCounter();

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
    ...compileAstNodes(body, uniqIndexCounter),
    {
      type: 'goto',
      key: startTag.key,
    },
    endTag,
  ];
};

const compilePromptCommand = ({
  setVars,
  key,
}: PromptCommand<unknown, unknown, unknown>): CompileMediateNode[] => [
  { type: 'tag', key, isEntryPoint: true },
  { type: 'prompt', setVars, key },
];

const compileCallCommand = ({
  script,
  withParams,
  setVars,
  key,
  goto,
}: CallCommand<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>): CompileMediateNode[] => [
  { type: 'tag', key, isEntryPoint: true },
  { type: 'call', script, withParams, setVars, goto, key },
];

const compileEffectCommand = (
  command: EffectCommand<unknown, unknown, unknown>,
): CompileMediateNode[] => [command];

const compileLabelAstNode = ({ key }: LabelAstNode): CompileMediateNode[] => [
  { type: 'tag', key, isEntryPoint: true },
];

const compileGotoAstNode = ({ key }: GotoAstNode): CompileMediateNode[] => [
  { type: 'goto', key },
];

const compileReturnCommand = ({
  getValue,
}: ReturnCommand<unknown, unknown, unknown>): CompileMediateNode[] => [
  { type: 'return', getValue },
];

const compileAstNode = <Vars, Input, Retrun, Yield, Meta>(
  segment: ScriptAstNode<Vars, Input, Retrun, Yield, Meta>,
  uniqIndexCounter: () => number,
): CompileMediateNode[] => {
  switch (segment.type) {
    case 'content':
      return compileContentCommand(segment);
    case 'conditions':
      return compileConditionsAstNode(segment, uniqIndexCounter);
    case 'while':
      return compileWhileAstNode(segment, uniqIndexCounter);
    case 'prompt':
      return compilePromptCommand(segment);
    case 'call':
      return compileCallCommand(segment);
    case 'effect':
      return compileEffectCommand(segment);
    case 'goto':
      return compileGotoAstNode(segment);
    case 'label':
      return compileLabelAstNode(segment);
    case 'return':
      return compileReturnCommand(segment);
    default:
      throw new TypeError(
        `unknown segment type: ${
          (segment as ScriptAstNode<Vars, Input, Retrun, Yield, Meta>).type
        }`,
      );
  }
};

const compileAstNodes = <Vars, Input, Retrun, Yield, Meta>(
  segments: ScriptAstNode<Vars, Input, Retrun, Yield, Meta>[],
  counter: () => number,
) =>
  segments.reduce(
    (compilingArray, segment) => [
      ...compilingArray,
      ...compileAstNode(segment, counter),
    ],
    [],
  );

const compile = <Vars, Input, Return, Yield, Meta>(
  segments: ScriptAstNode<Vars, Input, Return, Yield, Meta>[],
  meta: { scriptName: string },
): CompileResult<Vars, Input, Return, Yield, Meta> => {
  const keyIndex = new Map();
  const stopPointIndex = new Map();

  // remove tags and save indexes
  const mediateNodesWithTags = compileAstNodes(segments, createCounter());
  const mediateCommands: Exclude<CompileMediateNode, TagMediateNode>[] = [];

  for (const mediateNode of mediateNodesWithTags) {
    if (mediateNode.type === 'tag') {
      const { isEntryPoint, key } = mediateNode;

      invariant(
        !keyIndex.has(key),
        `key "${key}" duplicated in ${meta.scriptName}`,
      );

      keyIndex.set(key, mediateCommands.length);
      if (isEntryPoint) {
        stopPointIndex.set(key, mediateCommands.length);
      }
    } else {
      mediateCommands.push(mediateNode);
    }
  }

  // translate "goto" node to "jump" command
  const commands: ScriptCommand<unknown, unknown, unknown, unknown, unknown>[] =
    [];

  for (const [idx, command] of mediateCommands.entries()) {
    if (command.type === 'goto') {
      const targetIdx = keyIndex.get(command.key);
      invariant(targetIdx !== undefined, `label "${command.key}" not found`);

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
    commands: commands as ScriptCommand<Vars, Input, Return, Yield, Meta>[],
    stopPointIndex,
  };
};

export default compile;
