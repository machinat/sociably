import invariant from 'invariant';

export const addToAccumulates = (result, accumulates) => {
  accumulates.push(result);
};

export const addToLastBatchOfAccumulates = (result, accumulates) => {
  let lastBatch;
  // eslint-disable-next-line no-cond-assign
  if (
    accumulates.length === 0 ||
    !Array.isArray((lastBatch = accumulates[accumulates.length - 1]))
  ) {
    lastBatch = [];
    accumulates.push(lastBatch);
  }
  lastBatch.push(result);
};

export const addImmediatelyAsSeparator = (immediately, accumulates) => {
  const { after } = immediately.props;
  invariant(
    !after || typeof after === 'function',
    `props.after of Immediately element should be a function, got ${after}`
  );
  let last;
  // eslint-disable-next-line no-cond-assign
  if (
    accumulates.length > 0 &&
    Array.isArray((last = accumulates[accumulates.length - 1])) &&
    last.length === 0
  ) {
    // eslint-disable-next-line no-param-reassign
    accumulates[accumulates.length - 1] = immediately;
    accumulates.push(last);
  } else {
    accumulates.push(immediately);
  }
};
