// @flow
import invariant from 'invariant';

import type {
  RenderResult,
  BatchesOrSeparators,
  ImmediateElement,
} from './types';

export const appendResult = <R, N>(
  result: RenderResult<R, N>,
  accumulates: RenderResult<R, N>[]
) => {
  accumulates.push(result);
};

export const invariantNoSeparator = () => {
  invariant(
    false,
    `separator element should not be placed in the inner of native or general prop`
  );
};

export const appendResultToSequence = <R, N>(
  result: RenderResult<R, N>,
  accumulates: BatchesOrSeparators
) => {
  const { element } = result;
  invariant(
    !element ||
      typeof element === 'string' ||
      typeof element === 'number' ||
      typeof element.type === 'string' ||
      element.type.$$root,
    `'${String(
      element &&
        (typeof element.type === 'function' ? element.type.name : element.type)
    )}' is not legal root Component`
  );

  let lastBatch = accumulates[accumulates.length - 1];
  // eslint-disable-next-line no-cond-assign
  if (!Array.isArray(lastBatch)) {
    lastBatch = [];
    accumulates.push(lastBatch);
  }
  lastBatch.push(result);
};

export const appendSeparatorToSequence = (
  immediately: ImmediateElement,
  accumulates: BatchesOrSeparators
) => {
  const { after } = immediately.props;
  invariant(
    !after || typeof after === 'function',
    `props.after of Immediate element should be a function, got ${after}`
  );
  const last = accumulates[accumulates.length - 1];
  // eslint-disable-next-line no-cond-assign
  if (Array.isArray(last) && last.length === 0) {
    // eslint-disable-next-line no-param-reassign
    accumulates[accumulates.length - 1] = immediately;
    accumulates.push(last);
  } else {
    accumulates.push(immediately);
  }
};
