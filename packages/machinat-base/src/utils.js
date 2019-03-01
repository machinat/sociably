// @flow
import type { MiddlewareFunc } from './types';

export const identity = (x: any) => x;

export const empty = () => {};

export const compose = <Ctx, Val>(
  ...fns: MiddlewareFunc<Ctx, Val>[]
): MiddlewareFunc<Ctx, Val> => {
  if (fns.length === 0) return identity;
  if (fns.length === 1) return fns[0];

  let composed: MiddlewareFunc<Ctx, Val> = fns[0];
  for (let i = 1; i < fns.length; i += 1) {
    const previousFn = composed;
    const fn = fns[i];
    composed = (...args: [(Ctx) => Val]) => previousFn(fn(...args)); // eslint-disable-line no-loop-func
  }

  return composed;
};
