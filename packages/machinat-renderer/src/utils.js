import invariant from 'invariant';

export const addToAccumulates = (result, context) => {
  context.accumulates.push(result);
};

export const addToLastBatchOfAccumulates = (result, context) => {
  const { accumulates } = context;
  let lastBatch;
  if (
    accumulates.length === 0 ||
    !Array.isArray(accumulates[accumulates.length - 1])
  ) {
    lastBatch = [];
    accumulates.push(lastBatch);
  } else {
    lastBatch = accumulates[accumulates.length - 1];
  }
  lastBatch.push(result);
};

export const addImmediatelyAsSeparator = (immediately, context) => {
  const { after } = immediately.props;
  invariant(
    !after || typeof after === 'function',
    `props.after of Immediately element should be a function, got ${after}`
  );
  context.accumulates.push(immediately);
};
