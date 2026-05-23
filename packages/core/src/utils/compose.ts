const identity = <T>(x: T) => x;

function compose(): <T>(x: T) => T;
function compose<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result;
function compose<Args extends unknown[], Result>(
  ...fns: [(...args: Args) => Result, ...((x: Result) => Result)[]]
): (...args: Args) => Result;
function compose<Args extends unknown[], Result>(
  ...fns: [(...args: Args) => Result, ...((x: Result) => Result)[]] | []
): ((...args: Args) => Result) | (<T>(x: T) => T) {
  if (fns.length === 0) return identity;
  if (fns.length === 1) return fns[0];

  const len = fns.length;
  const lastFn = fns[len - 1] as (...args: Args) => Result;

  return (...args: Args) => {
    let result = lastFn(...args);

    for (let i = len - 2; i >= 0; i -= 1) {
      const fn = fns[i];
      result = fn(result);
    }

    return result;
  };
}

export default compose;
