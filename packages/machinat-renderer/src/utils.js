import invariant from 'invariant';

export const addToAccumulates = (result, context) => {
  context.accumulates.push(result);
};

export const addToLastBatchOfAccumulates = (result, context) => {
  const { accumulates } = context;
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

export const addImmediatelyAsSeparator = (immediately, context) => {
  const { after } = immediately.props;
  invariant(
    !after || typeof after === 'function',
    `props.after of Immediately element should be a function, got ${after}`
  );
  const { accumulates } = context;
  let last;
  // eslint-disable-next-line no-cond-assign
  if (
    accumulates.length > 0 &&
    Array.isArray((last = accumulates[accumulates.length - 1])) &&
    last.length === 0
  ) {
    accumulates[accumulates.length - 1] = immediately;
    accumulates.push(last);
  } else {
    accumulates.push(immediately);
  }
};
