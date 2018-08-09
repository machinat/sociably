// @flow
import isValidElementType from './isValidElementType';
import * as IsXXX from './isXXX';
import * as Children from './children';

const Utils = {
  isValidElementType,
  ...IsXXX,
};

export { Children, Utils };
export * from './symbol';
