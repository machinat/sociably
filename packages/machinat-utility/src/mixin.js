// @flow
const mixin = (...prototypes: Array<Object>) =>
  Object.defineProperties(
    {},
    Object.assign(
      {},
      ...prototypes.map(proto => Object.getOwnPropertyDescriptors(proto))
    )
  );

export default mixin;
