/* eslint @typescript-eslint/no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { SociablyElement } from '@sociably/core';
import { reduce } from '@sociably/core/iterator';
import { formatNode, isElement } from '@sociably/core/utils';

import { isScript } from './utils';
import {
  IF,
  THEN,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  LABEL,
  CALL,
  EFFECT,
  RETURN,
} from './keyword';
import type {
  ScriptNode,
  ConditionMatcher,
  IfProps,
  ElseIfProps,
  WhileProps,
  LabelProps,
  PromptProps,
  CallProps,
  EffectProps,
  ReturnProps,
  ContentNode,
  ScriptElement,
  ThenElement,
  ElseElement,
  ElseIfElement,
  ScriptSegment,
  ConditionsSegment,
  WhileSegment,
  PromptCommand,
  LabelSegment,
  CallCommand,
  EffectCommand,
  ReturnCommand,
  AnyScriptLibrary,
} from './types';

const ifChildrenReducer = (
  segment: ConditionsSegment<unknown>,
  node:
    | ThenElement<unknown, unknown, unknown, unknown>
    | ElseElement<unknown, unknown, unknown, unknown>
    | ElseIfElement<unknown, unknown, unknown, unknown>,
  path: string,
  { condition }: { condition: ConditionMatcher<unknown> }
) => {
  invariant(
    isElement(node) &&
      (node.type === THEN || node.type === ELSE || node.type === ELSE_IF),
    `only THEN, ELSE_IF, ELSE elements are afccepted within children of <IF/>, got: ${formatNode(
      node
    )}`
  );

  const { branches, fallbackBody } = segment;

  if (node.type === THEN) {
    invariant(
      branches.length === 0,
      '<THEN /> should be the first block wihtin <IF />'
    );

    branches.push({
      condition,
      body: parseBlock(node.props.children, `${path}.children`),
    });
  } else if (node.type === ELSE_IF) {
    const props = node.props as ElseIfProps<unknown, unknown, unknown, unknown>;

    invariant(
      branches.length > 0 && !fallbackBody,
      '<ELSE_IF /> should be placed between <THEN /> and <ELSE /> blocks'
    );

    invariant(
      typeof props.condition === 'function',
      'prop "condition" of <ELSE_IF/> should be a function'
    );

    segment.branches.push({
      condition: props.condition,
      body: parseBlock(node.props.children, `${path}.children`),
    });
  } else if (node.type === ELSE) {
    invariant(
      branches.length > 0 && !fallbackBody,
      fallbackBody
        ? 'multiple <ELSE/> block received in <IF/>'
        : 'no <THEN/> block before <ELSE/>'
    );

    // eslint-disable-next-line no-param-reassign
    segment.fallbackBody = parseBlock(node.props.children, `${path}.children`);
  }

  return segment;
};

const resolveIf = (
  { condition, children }: IfProps<unknown, unknown, unknown, unknown>,
  path: string
): ConditionsSegment<unknown> => {
  invariant(
    typeof condition === 'function',
    'prop "condition" of <IF/> should be a function'
  );

  return reduce<
    ConditionsSegment<unknown>,
    { condition: ConditionMatcher<unknown> }
  >(
    children,
    ifChildrenReducer,
    {
      type: 'conditions',
      branches: [],
      fallbackBody: null,
    },
    `${path}.children`,
    { condition }
  );
};

const resolveWhile = (
  { condition, children }: WhileProps<unknown, unknown, unknown, unknown>,
  path: string
): WhileSegment<unknown> => {
  invariant(
    typeof condition === 'function',
    'prop "condition" of <WHILE/> should be a function'
  );

  return {
    type: 'while',
    condition,
    body: parseBlock(children, `${path}.children`),
  };
};

const resolveLabel = ({ key }: LabelProps): LabelSegment => {
  invariant(key, 'prop "key" of <LABEL/> should not be empty');

  return {
    type: 'label',
    key,
  };
};

const resolvePrompt = ({
  key,
  set: setVars,
}: PromptProps<unknown, unknown>): PromptCommand<unknown, unknown> => {
  invariant(key, 'prop "key" of <PROMPT/> should not be empty');
  return {
    type: 'prompt',
    setVars,
    key,
  };
};

const resolveCall = ({
  script,
  params: withParams,
  set: setVars,
  key,
  goto,
}: CallProps<unknown, AnyScriptLibrary>): CallCommand<
  unknown,
  unknown,
  unknown,
  unknown
> => {
  invariant(isScript(script), `invalid "script" prop received on <CALL/>`);
  invariant(key, 'prop "key" of <CALL/> should not be empty');

  if (goto) {
    invariant(
      script.stopPointIndex.has(goto),
      `key "${goto}" not found in ${script.name}`
    );
  }

  return {
    type: 'call',
    script,
    withParams,
    setVars,
    goto,
    key,
  };
};

const resolveEffect = ({
  set: setVars,
  yield: yieldValue,
}: EffectProps<unknown, unknown>): EffectCommand<unknown, unknown> => {
  return {
    type: 'effect',
    setVars,
    yieldValue,
  };
};

const resolveReturn = ({
  value,
}: ReturnProps<unknown, unknown>): ReturnCommand<unknown, unknown> => {
  return { type: 'return', getValue: value };
};

const resolveElement = (
  node: ScriptElement<unknown, unknown, unknown, unknown>,
  path: string
): ScriptSegment<unknown, unknown, unknown, unknown> => {
  switch (node.type) {
    case IF:
      return resolveIf(
        node.props as IfProps<unknown, unknown, unknown, unknown>,
        path
      );
    case WHILE:
      return resolveWhile(
        node.props as WhileProps<unknown, unknown, unknown, unknown>,
        path
      );
    case PROMPT:
      return resolvePrompt(node.props as PromptProps<unknown, unknown>);
    case LABEL:
      return resolveLabel(node.props as LabelProps);
    case CALL:
      return resolveCall(node.props as CallProps<unknown, AnyScriptLibrary>);
    case EFFECT:
      return resolveEffect(node.props as EffectProps<unknown, unknown>);
    case RETURN:
      return resolveReturn(node.props as ReturnProps<unknown, unknown>);
    default:
      throw new TypeError(`unknown keyword: ${formatNode(node)}`);
  }
};

const blockReducer = (
  segments: ScriptSegment<unknown, unknown, unknown, unknown>[],
  node:
    | ScriptElement<unknown, unknown, unknown, unknown>
    | ContentNode<unknown>,
  path: string
) => {
  if (isElement(node)) {
    segments.push(resolveElement(node, path));
  } else {
    invariant(
      typeof node === 'function',
      `invalid script node: ${formatNode(node)}`
    );

    segments.push({
      type: 'content',
      getContent: node,
    });
  }

  return segments;
};

const parseBlock = <Vars, Input, Return, Yield>(
  node: ScriptNode<Vars, Input, Return, Yield>,
  path: string
): ScriptSegment<Vars, Input, Return, Yield>[] => {
  return reduce<ScriptSegment<Vars, Input, Return, Yield>[], void>(
    node as any,
    blockReducer as any,
    [],
    path,
    undefined
  );
};

const parse = <Vars, Input, Return, Yield>(
  node: SociablyElement<unknown, unknown>
): ScriptSegment<Vars, Input, Return, Yield>[] => {
  return parseBlock<Vars, Input, Return, Yield>(
    node as ScriptNode<Vars, Input, Return, Yield>,
    '$'
  );
};

export default parse;
