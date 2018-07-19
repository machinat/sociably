export const mixin = (...descriptors) =>
  Object.defineProperties({}, Object.assign({}, ...descriptors));

export const makeEvent = (name, proto) => raw =>
  Object.create(proto, {
    raw: {
      enumerable: true,
      value: raw,
    },
    type: {
      enumerable: true,
      value: name,
    },
  });
