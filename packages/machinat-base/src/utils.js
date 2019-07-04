// @flow
/* eslint-disable import/prefer-default-export */
export const validateMiddlewares = (fns: Function[]) => {
  for (const fn of fns) {
    if (typeof fn !== 'function') {
      throw new TypeError(`middleware must be a function, got ${fn}`);
    }
  }
};
