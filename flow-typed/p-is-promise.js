// @flow
/* eslint-disable no-unused-vars */
function isPromise(x: any): boolean %checks {
  return x instanceof Promise;
}

declare module 'p-is-promise' {
  declare export default typeof isPromise;
}
