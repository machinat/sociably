/** @internal */ /** */
/* eslint @typescript-eslint/no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { MachinatElement } from '@machinat/core/types';
import reduce from '@machinat/core/iterator/reduce';
import formatNode from '@machinat/core/utils/formatNode';
import { isElement } from '@machinat/core/utils/isX';
import { isKeyword, isScript } from './utils';
import {
  IF,
  THEN,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  VARS,
  LABEL,
  CALL,
  RETURN,
} from './keyword';
import type {
  ScriptNode,
  ConditionMatcher,
  IfProps,
  ElseIfProps,
  WhileProps,
  VarsProps,
  LabelProps,
  PromptProps,
  CallProps,
  ReturnProps,
  RenderContentNode,
  ScriptElement,
  ThenElement,
  ElseElement,
  ElseIfElement,
  ScriptIntermediate,
  ConditionsIntermediate,
  WhileIntermediate,
  SetVarsCommand,
  PromptCommand,
  LabelIntermediate,
  CallCommand,
  ReturnCommand,
} from './types';

const ifChildrenReducer = (
  segment: ConditionsIntermediate<unknown>,
  node:
    | ThenElement<unknown, unknown, unknown>
    | ElseElement<unknown, unknown, unknown>
    | ElseIfElement<unknown, unknown, unknown>,
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
      body: parseIntermediates(node.props.children, `${path}.children`),
    });
  } else if (node.type === ELSE_IF) {
    const props = node.props as ElseIfProps<unknown, unknown, unknown>;

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
      body: parseIntermediates(node.props.children, `${path}.children`),
    });
  } else if (node.type === ELSE) {
    invariant(
      branches.length > 0 && !fallbackBody,
      fallbackBody
        ? 'multiple <ELSE/> block received in <IF/>'
        : 'no <THEN/> block before <ELSE/>'
    );

    // eslint-disable-next-line no-param-reassign
    segment.fallbackBody = parseIntermediates(
      node.props.children,
      `${path}.children`
    );
  }

  return segment;
};

const resolveIf = (
  { condition, children }: IfProps<unknown, unknown, unknown>,
  path: string
): ConditionsIntermediate<unknown> => {
  invariant(
    typeof condition === 'function',
    'prop "condition" of <IF/> should be a function'
  );

  return reduce<
    ConditionsIntermediate<unknown>,
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
  { condition, children }: WhileProps<unknown, unknown, unknown>,
  path: string
): WhileIntermediate<unknown> => {
  invariant(
    typeof condition === 'function',
    'prop "condition" of <WHILE/> should be a function'
  );

  return {
    type: 'while',
    condition,
    body: parseIntermediates(children, `${path}.children`),
  };
};

const resolveVars = ({
  set: setter,
}: VarsProps<unknown>): SetVarsCommand<unknown> => {
  invariant(
    typeof setter === 'function',
    'prop "set" of <VARS/> should be a function'
  );

  return {
    type: 'set_vars',
    setter,
  };
};

const resolveLabel = ({ key }: LabelProps): LabelIntermediate => {
  invariant(key, 'prop "key" of <LABEL/> should not be empty');

  return {
    type: 'label',
    key,
  };
};

const resolvePrompt = ({
  set: setter,
  key,
}: PromptProps<unknown, unknown>): PromptCommand<unknown, unknown> => {
  invariant(key, 'prop "key" of <PROMPT/> should not be empty');
  return {
    type: 'prompt',
    setter,
    key,
  };
};

const resolveCall = ({
  script,
  withVars,
  set: setter,
  key,
  goto,
}: CallProps<unknown, unknown, unknown>): CallCommand<
  unknown,
  unknown,
  unknown
> => {
  invariant(isScript(script), `invalid "script" prop received on <CALL/>`);
  invariant(key, 'prop "key" of <CALL/> should not be empty');

  if (goto) {
    invariant(
      script.entriesIndex.has(goto),
      `key "${goto}" not found in ${script.name}`
    );
  }

  return {
    type: 'call',
    script,
    withVars,
    setter,
    goto,
    key,
  };
};

const resolveReturn = ({
  value,
}: ReturnProps<unknown, unknown>): ReturnCommand<unknown, unknown> => {
  return { type: 'return', valueGetter: value };
};

const segmentsReducer = (
  segments: ScriptIntermediate<unknown, unknown, unknown>[],
  node: ScriptElement<unknown, unknown, unknown> | RenderContentNode<unknown>,
  path: string
) => {
  if (isElement(node)) {
    invariant(isKeyword(node.type), `unexpected element: ${formatNode(node)}`);

    let segment: ScriptIntermediate<unknown, unknown, unknown>;
    if (node.type === IF) {
      segment = resolveIf(
        node.props as IfProps<unknown, unknown, unknown>,
        path
      );
    } else if (node.type === WHILE) {
      segment = resolveWhile(
        node.props as WhileProps<unknown, unknown, unknown>,
        path
      );
    } else if (node.type === VARS) {
      segment = resolveVars(node.props as VarsProps<unknown>);
    } else if (node.type === PROMPT) {
      segment = resolvePrompt(node.props as PromptProps<unknown, unknown>);
    } else if (node.type === LABEL) {
      segment = resolveLabel(node.props as LabelProps);
    } else if (node.type === CALL) {
      segment = resolveCall(node.props as CallProps<unknown, unknown, unknown>);
    } else if (node.type === RETURN) {
      segment = resolveReturn(node.props as ReturnProps<unknown, unknown>);
    } else {
      invariant(false, `unexpected keyword: ${formatNode(node)}`);
    }

    segments.push(segment);
  } else {
    invariant(
      typeof node === 'function',
      `invalid script node: ${formatNode(node)}`
    );

    segments.push({
      type: 'content',
      render: node,
    });
  }

  return segments;
};

const parseIntermediates = <Vars, Input, Return>(
  node: ScriptNode<Vars, Input, Return>,
  path: string
): ScriptIntermediate<Vars, Input, Return>[] => {
  return reduce<ScriptIntermediate<Vars, Input, Return>[], void>(
    node as any,
    segmentsReducer as any,
    [],
    path,
    undefined
  );
};

const parse = <Vars, Input, Return>(
  node: MachinatElement<unknown, unknown>
): ScriptIntermediate<Vars, Input, Return>[] => {
  return parseIntermediates<Vars, Input, Return>(
    node as ScriptNode<Vars, Input, Return>,
    '$'
  );
};

export default parse;
