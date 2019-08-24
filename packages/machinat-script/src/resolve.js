// @flow
/* eslint no-use-before-define: ["error", { "variables": false }] */
import invariant from 'invariant';
import { reduce, isElement, formatNode } from 'machinat-utility';
import type { NodeReducer } from 'machinat-utility/types';
import * as KEYWORDS from './keyword';
import { isKeyword, isScript, counter } from './utils';
import type {
  MachinatScriptNode,
  VarsMatcher,
  ScriptSegment,
  IfSegment,
  ForSegment,
  WhileSegment,
  SetVarsSegment,
  PromptSegment,
  LabelSegment,
  CallSegment,
} from './types';

const ifChildrenReducer: NodeReducer<
  IfSegment,
  { condition: VarsMatcher, stopPointCounter: () => number }
> = (segment, node, path, { condition, stopPointCounter }) => {
  invariant(
    isElement(node) &&
      (node.type === KEYWORDS.Then ||
        node.type === KEYWORDS.Else ||
        node.type === KEYWORDS.ElseIf),
    `only <[Then, ElseIf, Else]/> accepted within children of <If/>, got: ${formatNode(
      node
    )}`
  );

  const { branches, fallback } = segment;

  if (node.type === KEYWORDS.Then) {
    invariant(
      branches.length === 0,
      '<Then /> should be the first block wihtin <If />'
    );

    branches.push({
      condition,
      body: resolveSegments(
        node.props.children,
        `${path}.children`,
        stopPointCounter
      ),
    });
  } else if (node.type === KEYWORDS.ElseIf) {
    invariant(
      branches.length > 0 && !fallback,
      '<ElseIf /> should be placed between <Then /> and <Else /> blocks'
    );

    invariant(
      typeof node.props.condition === 'function',
      'prop "condition" of <ElseIf/> should be a function'
    );

    segment.branches.push({
      condition: node.props.condition,
      body: resolveSegments(
        node.props.children,
        `${path}.children`,
        stopPointCounter
      ),
    });
  } else if (node.type === KEYWORDS.Else) {
    invariant(
      branches.length > 0 && !fallback,
      fallback
        ? 'multiple <Else/> block received in <If/>'
        : 'no <Then/> block before <Else/>'
    );

    // eslint-disable-next-line no-param-reassign
    segment.fallback = resolveSegments(
      node.props.children,
      `${path}.children`,
      stopPointCounter
    );
  }

  return segment;
};

const resolveIfSegment = (
  props: Object,
  path: string,
  stopPointCounter: () => number
): IfSegment => {
  const { condition, children, key } = props;

  invariant(
    typeof condition === 'function',
    'prop "condition" of <If/> should be a function'
  );

  return reduce(
    children,
    ifChildrenReducer,
    {
      type: 'if',
      branches: [],
      fallback: undefined,
      key,
    },
    `${path}.children`,
    { condition, stopPointCounter }
  );
};

const resolveForSegment = (
  props: Object,
  path: string,
  stopPointCounter: () => number
): ForSegment => {
  const { var: varName, of: getIterable, children, key } = props;

  invariant(
    typeof getIterable === 'function',
    'prop "of" of <For/> should be a function retruns iterable'
  );

  return {
    type: 'for',
    varName,
    getIterable,
    body: resolveSegments(children, `${path}.children`, stopPointCounter),
    key,
  };
};

const resolveWhileSegment = (
  props: Object,
  path: string,
  stopPointCounter: () => number
): WhileSegment => {
  const { condition, children, key } = props;

  invariant(
    typeof condition === 'function',
    'prop "condition" of <While/> should be a function'
  );

  return {
    type: 'while',
    condition,
    body: resolveSegments(children, `${path}.children`, stopPointCounter),
    key,
  };
};

const resolveVarsSegment = ({ set: setter }: Object): SetVarsSegment => {
  invariant(typeof setter === 'function', ``);

  return {
    type: 'set_vars',
    setter,
  };
};

const resolveLabelSegment = ({ key }: Object): LabelSegment => {
  invariant(key, 'prop "key" of <Label/> should not be empty');

  return {
    type: 'label',
    key,
  };
};

const resolvePromptSegment = (
  { set: setter, key }: Object,
  stopPointCounter: () => number
): PromptSegment => {
  const count = stopPointCounter();
  return {
    type: 'prompt',
    setter,
    key: key || `prompt#${count}`,
  };
};

const resolveCallSegemnt = (
  props: Object,
  stopPointCounter: () => number
): CallSegment => {
  const { script, withVars, goto: gotoKey, key } = props;
  invariant(isScript(script), `invalid "script" prop received on <Call/>`);

  if (gotoKey) {
    invariant(
      script._keyMapping.has(gotoKey),
      `key "${gotoKey}" not found in ${script.name}`
    );
  }

  const count = stopPointCounter();
  return {
    type: 'call',
    script,
    withVars,
    gotoKey,
    key: key || `call#${count}`,
  };
};

const segmentsReducer: NodeReducer<
  ScriptSegment[],
  { stopPointCounter: () => number }
> = (segments, node, path, { stopPointCounter }) => {
  if (isElement(node)) {
    const { type } = node;
    invariant(isKeyword(type), `unexpected element: ${formatNode(node)}`);

    let segment;
    if (type === KEYWORDS.If) {
      segment = resolveIfSegment(node.props, path, stopPointCounter);
    } else if (type === KEYWORDS.For) {
      segment = resolveForSegment(node.props, path, stopPointCounter);
    } else if (type === KEYWORDS.While) {
      segment = resolveWhileSegment(node.props, path, stopPointCounter);
    } else if (type === KEYWORDS.Vars) {
      segment = resolveVarsSegment(node.props);
    } else if (type === KEYWORDS.Prompt) {
      segment = resolvePromptSegment(node.props, stopPointCounter);
    } else if (type === KEYWORDS.Label) {
      segment = resolveLabelSegment(node.props);
    } else if (type === KEYWORDS.Call) {
      segment = resolveCallSegemnt(node.props, stopPointCounter);
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

const resolveSegments = (
  node: MachinatScriptNode,
  path: string,
  stopPointCounter: () => number
) => {
  return reduce(node, segmentsReducer, [], path, { stopPointCounter });
};

const resolve = (node: MachinatScriptNode) => {
  return resolveSegments(node, '$', counter());
};

export default resolve;
