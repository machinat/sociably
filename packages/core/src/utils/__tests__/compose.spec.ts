import moxy from '@moxyjs/moxy';
import compose from '../compose.js';

it('return an identity function if nothing passed', () => {
  const fn = compose();

  expect(fn({ foo: 'bar' })).toEqual({ foo: 'bar' });
});

it('return the same function if only 1 function to be compose', () => {
  const add = (...args) => args.reduce((a, b) => a + b);
  const fn = compose(add);

  expect(fn(1)).toBe(1);
  expect(fn(1, 2, 3)).toBe(6);
});

it('pipe the function from right to left', () => {
  const fn1 = moxy((input) => `${input}1`);
  const fn2 = moxy((input) => `${input}2`);
  const fn3 = moxy((input) => `${input}3`);
  const fn4 = moxy((input) => `${input}4`);
  const fn5 = moxy((input) => `${input}5`);

  expect(compose(fn1, fn2, fn3, fn4, fn5)('👉')).toBe('👉54321');

  expect(fn1).toHaveBeenCalledWith('👉5432');
  expect(fn2).toHaveBeenCalledWith('👉543');
  expect(fn3).toHaveBeenCalledWith('👉54');
  expect(fn4).toHaveBeenCalledWith('👉5');
  expect(fn5).toHaveBeenCalledWith('👉');
});

it('pass last function with full args but rest with the result of next', () => {
  const fn1 = moxy((...args) => `${args.join('')}1`);
  const fn2 = moxy((...args) => `${args.join('')}2`);
  const fn3 = moxy((...args) => `${args.join('')}3`);

  expect(compose(fn1, fn2, fn3)('a', 'b', 'c')).toBe('abc321');

  expect(fn1).toHaveBeenCalledWith('abc32');
  expect(fn2).toHaveBeenCalledWith('abc3');
  expect(fn3).toHaveBeenCalledWith('a', 'b', 'c');
});
