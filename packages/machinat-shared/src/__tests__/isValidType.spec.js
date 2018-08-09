import isValidElementType from '../isValidElementType';
import { MACHINAT_FRAGMENT_TYPE } from '../symbol';

test('strings are valid', () => {
  ['text', 'a', 'b', 'i'].forEach(str => {
    expect(isValidElementType(str)).toBe(true);
  });
});

test('functions are valid', () => {
  [
    () => {},
    function f() {},
    () => 'abc',
    function ff(a, b) {
      return `${a}_${b}`;
    },
  ].forEach(func => {
    expect(isValidElementType(func)).toBe(true);
  });
});

test('fragment symbol is valid', () => {
  expect(isValidElementType(MACHINAT_FRAGMENT_TYPE)).toBe(true);
});

test('others are invalid', () => {
  [null, undefined, 0, 1, 6.66, true, false, {}, [], Symbol('n')].forEach(
    outlaw => {
      expect(isValidElementType(outlaw)).toBe(false);
    }
  );
});
