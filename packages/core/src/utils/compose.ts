const identity = <T>(x: T) => x;

const compose = <T>(...fns: ((x: T) => T)[]): ((x: T) => T) => {
  if (fns.length === 0) return identity;
  if (fns.length === 1) return fns[0];

  const len = fns.length;

  return (...args: [T]) => {
    let result = fns[len - 1](...args);

    for (let i = len - 2; i >= 0; i -= 1) {
      const fn = fns[i];
      result = fn(result);
    }

    return result;
  };
};

export default compose;
