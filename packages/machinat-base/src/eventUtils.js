// @flow
export const mixin = (...descriptors: Array<Object>) =>
  Object.defineProperties({}, Object.assign({}, ...descriptors));

export const makeEvent = (type: string, subType: string, proto: Object) => (
  raw: Object
): { raw: Object, type: string, subType: string } =>
  Object.create(proto, {
    raw: {
      enumerable: true,
      value: raw,
    },
    type: {
      enumerable: true,
      value: type,
    },
    subType: {
      enumerable: true,
      value: subType,
    },
  });
