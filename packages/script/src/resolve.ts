/** @internal */ /** */
/* eslint @typescript-eslint/no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import reduce from '@machinat/core/iterator/reduce';
import formatNode from '@machinat/core/utils/formatNode';
import { isElement } from '@machinat/core/utils/isX';
import * as KEYWORDS from './keyword';
import { isKeyword, isScript } from './utils';
import type {
  ScriptNode,
  ConditionMatcher,
  IfProps,
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
  ScriptSegment,
  ConditionsSegment,
  WhileSegment,
  SetVarsSegment,
  PromptSegment,
  LabelSegment,
  CallSegment,
  ReturnSegment,
} from './types';

const ifChildrenReducer = (
  segment: ConditionsSegment<unknown>,
  node:
    | ThenElement<unknown, unknown, unknown>
    | ElseElement<unknown, unknown, unknown>
    | ElseIfElement<unknown, unknown, unknown>,
  path: string,
  { condition }: { condition: ConditionMatcher<unknown> }
) => {
  invariant(
    isElement(node) &&
      (node.type === KEYWORDS.THEN ||
        node.type === KEYWORDS.ELSE ||
        node.type === KEYWORDS.ELSE_IF),
    `only <[THEN, ELSE_IF, ELSE]/> accepted within children of <IF/>, got: ${formatNode(
      node
    )}`
  );

  const { branches, fallbackBody } = segment;

  if (node.type === KEYWORDS.THEN) {
    invariant(
      branches.length === 0,
      '<THEN /> should be the first block wihtin <IF />'
    );

    branches.push({
      condition,
      body: resolveSegments(node.props.children, `${path}.children`),
    });
  } else if (node.type === KEYWORDS.ELSE_IF) {
    invariant(
      branches.length > 0 && !fallbackBody,
      '<ELSE_IF /> should be placed between <THEN /> and <ELSE /> blocks'
    );

    invariant(
      typeof node.props.condition === 'function',
      'prop "condition" of <ELSE_IF/> should be a function'
    );

    segment.branches.push({
      condition: node.props.condition,
      body: resolveSegments(node.props.children, `${path}.children`),
    });
  } else if (node.type === KEYWORDS.ELSE) {
    invariant(
      branches.length > 0 && !fallbackBody,
      fallbackBody
        ? 'multiple <ELSE/> block received in <IF/>'
        : 'no <THEN/> block before <ELSE/>'
    );

    // eslint-disable-next-line no-param-reassign
    segment.fallbackBody = resolveSegments(
      node.props.children,
      `${path}.children`
    );
  }

  return segment;
};

const resolveIf = (
  { condition, children }: IfProps<unknown, unknown, unknown>,
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
  { condition, children }: WhileProps<unknown, unknown, unknown>,
  path: string
): WhileSegment<unknown> => {
  invariant(
    typeof condition === 'function',
    'prop "condition" of <WHILE/> should be a function'
  );

  return {
    type: 'while',
    condition,
    body: resolveSegments(children, `${path}.children`),
  };
};

const resolveVars = ({
  set: setter,
}: VarsProps<unknown>): SetVarsSegment<unknown> => {
  invariant(
    typeof setter === 'function',
    'prop "set" of <VARS/> should be a function'
  );

  return {
    type: 'set_vars',
    setter,
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
  set: setter,
  key,
}: PromptProps<unknown, unknown>): PromptSegment<unknown, unknown> => {
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
}: CallProps<unknown, unknown, unknown>): CallSegment<
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
}: ReturnProps<unknown>): ReturnSegment<unknown> => {
  return { type: 'return', valueGetter: value };
};

const segmentsReducer = (
  segments: ScriptSegment<unknown, unknown, unknown>[],
  node: ScriptElement<unknown, unknown, unknown> | RenderContentNode<unknown>,
  path: string
) => {
  if (isElement(node)) {
    invariant(isKeyword(node.type), `unexpected element: ${formatNode(node)}`);

    let segment: ScriptSegment<unknown, unknown, unknown>;
    if (node.type === KEYWORDS.IF) {
      segment = resolveIf(node.props, path);
    } else if (node.type === KEYWORDS.WHILE) {
      segment = resolveWhile(node.props, path);
    } else if (node.type === KEYWORDS.VARS) {
      segment = resolveVars(node.props);
    } else if (node.type === KEYWORDS.PROMPT) {
      segment = resolvePrompt(node.props);
    } else if (node.type === KEYWORDS.LABEL) {
      segment = resolveLabel(node.props);
    } else if (node.type === KEYWORDS.CALL) {
      segment = resolveCall(node.props);
    } else if (node.type === KEYWORDS.RETURN) {
      segment = resolveReturn(node.props);
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

const resolveSegments = <Vars, Input, Return>(
  node: ScriptNode<Vars, Input, Return>,
  path: string
): ScriptSegment<Vars, Input, Return>[] => {
  return reduce<ScriptSegment<Vars, Input, Return>[], void>(
    node as any,
    segmentsReducer as any,
    [],
    path,
    undefined
  );
};

const resolve = <Vars, Input, Return>(
  node: ScriptNode<Vars, Input, Return>
): ScriptSegment<Vars, Input, Return>[] => {
  return resolveSegments<Vars, Input, Return>(node, '$');
};

export default resolve;
