// @flow
export const mixin = (...descriptors: Array<Object>) =>
  Object.defineProperties({}, Object.assign({}, ...descriptors));

export const makeEvent = (type: string, subtype: string, proto: Object) => (
  raw: Object
): { raw: Object, type: string, subtype: string } => {
  const event = Object.create(proto);

  event.raw = raw;
  event.type = type;
  event.subtype = subtype;

  return event;
};
