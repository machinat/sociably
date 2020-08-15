const mixin = (...prototypes: Array<any>) =>
  Object.defineProperties(
    {},
    Object.assign(
      {},
      ...prototypes.map((proto) => Object.getOwnPropertyDescriptors(proto))
    )
  );

export default mixin;
