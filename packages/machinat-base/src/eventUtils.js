// @flow
export const mixin = (...prototypes: Array<Object>) =>
  Object.defineProperties(
    {},
    Object.assign(
      {},
      ...prototypes.map(proto => Object.getOwnPropertyDescriptors(proto))
    )
  );

export function toJSONWithProto() {
  /* eslint-disable guard-for-in, no-restricted-syntax */
  const obj = {};
  for (const k in this) {
    obj[k] = this[k];
  }

  return obj;
  /* eslint-enable guard-for-in, no-restricted-syntax */
}
