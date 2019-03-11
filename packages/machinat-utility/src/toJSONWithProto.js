// @flow
function toJSONWithProto() {
  /* eslint-disable guard-for-in, no-restricted-syntax */
  const obj = {};
  for (const k in this) {
    obj[k] = this[k];
  }

  return obj;
  /* eslint-enable guard-for-in, no-restricted-syntax */
}

export default toJSONWithProto;
