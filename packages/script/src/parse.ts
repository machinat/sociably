/* eslint @typescript-eslint/no-use-before-define: ["error", { "variables": false }] */
import { SociablyElement } from '@sociably/core';
import { reduce } from '@sociably/core/iterator';
import { formatNode, isElement } from '@sociably/core/utils';

import { isScript } from './utils.js';
import {
  IF,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  LABEL,
  GOTO,
  CALL,
  EFFECT,
  RETURN,
} from './keyword.js';
import type {
  ScriptNode,
  IfProps,
  BlockProps,
  WhileProps,
  LabelProps,
  GotoProps,
  PromptProps,
  CallProps,
  EffectProps,
  ReturnProps,
  ContentNode,
  ScriptElement,
  ScriptAstNode,
  ConditionsAstNode,
  WhileAstNode,
  LabelAstNode,
  GotoAstNode,
  PromptCommand,
  CallCommand,
  EffectCommand,
  ReturnCommand,
  AnyScriptLibrary,
} from './types.js';

type UnknownScriptAstNode = ScriptAstNode<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>;
type UnknownIfProps = IfProps<unknown, unknown, unknown, unknown, unknown>;
type UnknownBlockProps = BlockProps<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>;

const resolveIf = (
  { condition, children }: UnknownIfProps,
  path: string,
): ConditionsAstNode<unknown, unknown> => {
  if (typeof condition !== 'function') {
    throw new SyntaxError('prop "condition" of <IF/> should be a function');
  }

  return {
    type: 'conditions',
    branches: [{ condition, body: parseBlock(children, `${path}.children`) }],
    fallbackBody: null,
  };
};

const resolveElseIf = (
  lastAstNode: ConditionsAstNode<unknown, unknown>,
  { condition, children }: UnknownIfProps,
  path: string,
): ConditionsAstNode<unknown, unknown> => {
  if (lastAstNode.fallbackBody) {
    throw new SyntaxError(
      '<ELSE_IF/> should be placed right after <IF/> or <ELSE_IF> block',
    );
  }
  if (typeof condition !== 'function') {
    throw new SyntaxError(
      'prop "condition" of <ELSE_IF/> should be a function',
    );
  }
  return {
    ...lastAstNode,
    branches: [
      ...lastAstNode.branches,
      {
        condition,
        body: parseBlock(children, `${path}.children`),
      },
    ],
  };
};

const resolveElse = (
  lastAstNode: ConditionsAstNode<unknown, unknown>,
  { children }: UnknownBlockProps,
  path: string,
): ConditionsAstNode<unknown, unknown> => {
  if (lastAstNode.fallbackBody) {
    throw new SyntaxError(
      '<ELSE/> should be placed right after <IF/> or <ELSE_IF> block',
    );
  }
  return {
    ...lastAstNode,
    fallbackBody: parseBlock(children, `${path}.children`),
  };
};

const resolveWhile = (
  {
    condition,
    children,
  }: WhileProps<unknown, unknown, unknown, unknown, unknown>,
  path: string,
): WhileAstNode<unknown, unknown> => {
  if (typeof condition !== 'function') {
    throw new SyntaxError('prop "condition" of <WHILE/> should be a function');
  }

  return {
    type: 'while',
    condition,
    body: parseBlock(children, `${path}.children`),
  };
};

const resolveLabel = ({ key }: LabelProps): LabelAstNode => {
  if (!key) {
    throw new SyntaxError('prop "key" of <LABEL/> cannot be empty');
  }

  return {
    type: 'label',
    key,
  };
};

const resolveGoto = ({ key }: GotoProps): GotoAstNode => {
  if (!key) {
    throw new SyntaxError('prop "key" of <GOTO/> cannot be empty');
  }

  return { type: 'goto', key };
};

const resolvePrompt = ({
  key,
  set: setVars,
}: PromptProps<unknown, unknown, unknown>): PromptCommand<
  unknown,
  unknown,
  unknown
> => {
  if (!key) {
    throw new SyntaxError('prop "key" of <PROMPT/> cannot be empty');
  }
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
  unknown,
  unknown
> => {
  if (!isScript(script)) {
    throw new SyntaxError(`invalid "script" prop received on <CALL/>`);
  }
  if (!key) {
    throw new SyntaxError('prop "key" of <CALL/> cannot be empty');
  }
  if (goto && !script.stopPointIndex.has(goto)) {
    throw new SyntaxError(`key "${goto}" not found in ${script.name}`);
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
}: EffectProps<unknown, unknown, unknown>): EffectCommand<
  unknown,
  unknown,
  unknown
> => ({
  type: 'effect',
  setVars,
  yieldValue,
});

const resolveReturn = ({
  value,
}: ReturnProps<unknown, unknown, unknown>): ReturnCommand<
  unknown,
  unknown,
  unknown
> => ({ type: 'return', getValue: value });

const resolveElement = (
  previousAstNodes: UnknownScriptAstNode[],
  element: ScriptElement<unknown, unknown, unknown, unknown, unknown>,
  path: string,
): UnknownScriptAstNode[] => {
  if (element.type === ELSE || element.type === ELSE_IF) {
    const lastAstNode = previousAstNodes[previousAstNodes.length - 1];
    if (lastAstNode?.type !== 'conditions') {
      throw new SyntaxError(
        `<${element.type.name}/> should be placed right after <IF/> or <ELSE_IF> block`,
      );
    }

    return [
      ...previousAstNodes.slice(0, -1),
      element.type === ELSE_IF
        ? resolveElseIf(lastAstNode, element.props as UnknownIfProps, path)
        : resolveElse(lastAstNode, element.props as UnknownBlockProps, path),
    ];
  }

  let segment: UnknownScriptAstNode;
  if (element.type === IF) {
    segment = resolveIf(element.props as UnknownIfProps, path);
  } else if (element.type === WHILE) {
    segment = resolveWhile(
      element.props as WhileProps<unknown, unknown, unknown, unknown, unknown>,
      path,
    );
  } else if (element.type === PROMPT) {
    segment = resolvePrompt(
      element.props as PromptProps<unknown, unknown, unknown>,
    );
  } else if (element.type === LABEL) {
    segment = resolveLabel(element.props as LabelProps);
  } else if (element.type === GOTO) {
    segment = resolveGoto(element.props as GotoProps);
  } else if (element.type === CALL) {
    segment = resolveCall(
      element.props as CallProps<unknown, AnyScriptLibrary>,
    );
  } else if (element.type === EFFECT) {
    segment = resolveEffect(
      element.props as EffectProps<unknown, unknown, unknown>,
    );
  } else if (element.type === RETURN) {
    segment = resolveReturn(
      element.props as ReturnProps<unknown, unknown, unknown>,
    );
  } else {
    throw new TypeError(`unknown keyword: ${formatNode(element)}`);
  }
  return [...previousAstNodes, segment];
};

const blockReducer = (
  segments: UnknownScriptAstNode[],
  node:
    | ScriptElement<unknown, unknown, unknown, unknown, unknown>
    | ContentNode<unknown, unknown>,
  path: string,
) => {
  if (isElement(node)) {
    return resolveElement(segments, node, path);
  }
  if (typeof node !== 'function') {
    throw new SyntaxError(`invalid script node: ${formatNode(node)}`);
  }

  segments.push({
    type: 'content',
    getContent: node,
  });

  return segments;
};

const parseBlock = <Vars, Input, Return, Yield, Meta>(
  node: ScriptNode<Vars, Input, Return, Yield, Meta>,
  path: string,
): ScriptAstNode<Vars, Input, Return, Yield, Meta>[] =>
  reduce<ScriptAstNode<Vars, Input, Return, Yield, Meta>[], void>(
    node as any,
    blockReducer as any,
    [],
    path,
    undefined,
  );

const parseScript = <Vars, Input, Return, Yield, Meta>(
  node: SociablyElement<unknown, unknown>,
): ScriptAstNode<Vars, Input, Return, Yield, Meta>[] =>
  parseBlock<Vars, Input, Return, Yield, Meta>(
    node as ScriptNode<Vars, Input, Return, Yield, Meta>,
    '$',
  );

export default parseScript;
