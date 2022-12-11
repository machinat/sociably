/* eslint @typescript-eslint/no-use-before-define: ["error", { "variables": false }] */
import { SociablyElement } from '@sociably/core';
import { reduce } from '@sociably/core/iterator';
import { formatNode, isElement } from '@sociably/core/utils';

import { isScript } from './utils';
import {
  IF,
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
  IfProps,
  BlockProps,
  WhileProps,
  LabelProps,
  PromptProps,
  CallProps,
  EffectProps,
  ReturnProps,
  ContentNode,
  ScriptElement,
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

const resolveIf = (
  { condition, children }: IfProps<unknown, unknown, unknown, unknown>,
  path: string
): ConditionsSegment<unknown> => {
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
  lastSegment: ConditionsSegment<unknown>,
  { condition, children }: IfProps<unknown, unknown, unknown, unknown>,
  path: string
): ConditionsSegment<unknown> => {
  if (lastSegment.fallbackBody) {
    throw new SyntaxError(
      '<ELSE_IF/> should be placed right after <IF/> or <ELSE_IF> block'
    );
  }
  if (typeof condition !== 'function') {
    throw new SyntaxError(
      'prop "condition" of <ELSE_IF/> should be a function'
    );
  }
  return {
    ...lastSegment,
    branches: [
      ...lastSegment.branches,
      {
        condition,
        body: parseBlock(children, `${path}.children`),
      },
    ],
  };
};

const resolveElse = (
  lastSegment: ConditionsSegment<unknown>,
  { children }: BlockProps<unknown, unknown, unknown, unknown>,
  path: string
): ConditionsSegment<unknown> => {
  if (lastSegment.fallbackBody) {
    throw new SyntaxError(
      '<ELSE/> should be placed right after <IF/> or <ELSE_IF> block'
    );
  }
  return {
    ...lastSegment,
    fallbackBody: parseBlock(children, `${path}.children`),
  };
};

const resolveWhile = (
  { condition, children }: WhileProps<unknown, unknown, unknown, unknown>,
  path: string
): WhileSegment<unknown> => {
  if (typeof condition !== 'function') {
    throw new SyntaxError('prop "condition" of <WHILE/> should be a function');
  }

  return {
    type: 'while',
    condition,
    body: parseBlock(children, `${path}.children`),
  };
};

const resolveLabel = ({ key }: LabelProps): LabelSegment => {
  if (!key) {
    throw new SyntaxError('prop "key" of <LABEL/> should not be empty');
  }

  return {
    type: 'label',
    key,
  };
};

const resolvePrompt = ({
  key,
  set: setVars,
}: PromptProps<unknown, unknown>): PromptCommand<unknown, unknown> => {
  if (!key) {
    throw new SyntaxError('prop "key" of <PROMPT/> should not be empty');
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
  unknown
> => {
  if (!isScript(script)) {
    throw new SyntaxError(`invalid "script" prop received on <CALL/>`);
  }
  if (!key) {
    throw new SyntaxError('prop "key" of <CALL/> should not be empty');
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
  previousSegments: ScriptSegment<unknown, unknown, unknown, unknown>[],
  element: ScriptElement<unknown, unknown, unknown, unknown>,
  path: string
): ScriptSegment<unknown, unknown, unknown, unknown>[] => {
  if (element.type === ELSE || element.type === ELSE_IF) {
    const lastSegment = previousSegments[previousSegments.length - 1];
    if (lastSegment?.type !== 'conditions') {
      throw new SyntaxError(
        `<${element.type.name}/> should be placed right after <IF/> or <ELSE_IF> block`
      );
    }

    return [
      ...previousSegments.slice(0, -1),
      element.type === ELSE_IF
        ? resolveElseIf(
            lastSegment,
            element.props as IfProps<unknown, unknown, unknown, unknown>,
            path
          )
        : resolveElse(
            lastSegment,
            element.props as BlockProps<unknown, unknown, unknown, unknown>,
            path
          ),
    ];
  }

  let segment: ScriptSegment<unknown, unknown, unknown, unknown>;
  if (element.type === IF) {
    segment = resolveIf(
      element.props as IfProps<unknown, unknown, unknown, unknown>,
      path
    );
  } else if (element.type === WHILE) {
    segment = resolveWhile(
      element.props as WhileProps<unknown, unknown, unknown, unknown>,
      path
    );
  } else if (element.type === PROMPT) {
    segment = resolvePrompt(element.props as PromptProps<unknown, unknown>);
  } else if (element.type === LABEL) {
    segment = resolveLabel(element.props as LabelProps);
  } else if (element.type === CALL) {
    segment = resolveCall(
      element.props as CallProps<unknown, AnyScriptLibrary>
    );
  } else if (element.type === EFFECT) {
    segment = resolveEffect(element.props as EffectProps<unknown, unknown>);
  } else if (element.type === RETURN) {
    segment = resolveReturn(element.props as ReturnProps<unknown, unknown>);
  } else {
    throw new TypeError(`unknown keyword: ${formatNode(element)}`);
  }
  return [...previousSegments, segment];
};

const blockReducer = (
  segments: ScriptSegment<unknown, unknown, unknown, unknown>[],
  node:
    | ScriptElement<unknown, unknown, unknown, unknown>
    | ContentNode<unknown>,
  path: string
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
