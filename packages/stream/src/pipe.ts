function pipe<A, B>(fn1: (a: A) => B): (a: A) => B;
function pipe<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
function pipe<A, B, C, D>(
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
): (a: A) => D;
function pipe<A, B, C, D, E>(
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
): (a: A) => E;
function pipe<A, B, C, D, E, F>(
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
): (a: A) => F;
function pipe<T>(...fns: ((x: T) => T)[]): (x: T) => T;

function pipe(...fns: ((x: unknown) => unknown)[]): (x: unknown) => unknown {
  if (fns.length === 0) {
    return (x) => x;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return (input) => fns.reduce((output, fn) => fn(output), input);
}

export default pipe;
