export const compose = (fn1, fn2) => (...args) => fn1(fn2(...args));

export const map = mapper => values => values && values.map(mapper);
