// @flow
export const mixin = (...descriptors: Array<Object>) =>
  Object.defineProperties({}, Object.assign({}, ...descriptors));

export const makeEvent = (type: string, subtype: string, proto: Object) => (
  raw: Object
): { raw: Object, type: string, subtype: string } =>
  Object.create(proto, {
    raw: {
      enumerable: true,
      value: raw,
    },
    type: {
      enumerable: true,
      value: type,
    },
    subtype: {
      enumerable: true,
      value: subtype,
    },
  });
