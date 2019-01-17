// @flow
/* eslint-disable no-param-reassign */
import type { MachinatThread } from 'machinat-base/types';

export const annotate = (...decorators: ((Function) => void)[]) => (
  Component: Function
) => {
  for (let i = 0; i < decorators.length; i += 1) {
    const decorator = decorators[i];
    decorator(Component);
  }

  return Component;
};

export const asNative = (type: Symbol) => (Component: Function) => {
  Component.$$native = type;
};

export const asUnit = (is: boolean) => (Component: Function) => {
  Component.$$unit = is;
};

export const hasEntry = (path: string | (MachinatThread => string)) => (
  Component: Function
) => {
  Component.$$entry = path;
};

export const asContainer = (is: boolean) => (Component: Function) => {
  Component.$$container = is;
};
