import Machinat from 'machinat';
import valuesOfAssertedTypes from '../valuesOfAssertedTypes';

const A = () => 'a';
const B = () => 'b';
const C = () => 'c';

it('render and return values', () => {
  expect(
    valuesOfAssertedTypes(() => [A, B, C, 'foo', 'bar'])([
      { type: 'part', node: <A />, value: { x: 'a' }, path: '$#X.y:0' },
      { type: 'part', node: <foo />, value: { x: 'foo' }, path: '$#X.y:1' },
      { type: 'part', node: <B />, value: { x: 'b' }, path: '$#X.y:2' },
      { type: 'part', node: <bar />, value: { x: 'bar' }, path: '$#X.y:3' },
      { type: 'part', node: <C />, value: { x: 'c' }, path: '$#X.y:4' },
    ])
  ).toEqual([{ x: 'a' }, { x: 'foo' }, { x: 'b' }, { x: 'bar' }, { x: 'c' }]);
});

const valuesOfAFoo = valuesOfAssertedTypes(() => [A, 'foo']);

it('throw if string contained', () => {
  expect(() =>
    valuesOfAFoo([
      { type: 'part', node: <A />, value: { x: 'a' }, path: '$#X.y:0' },
      { type: 'text', node: 'abc', value: 'abc', path: '$#X.y:1' },
      { type: 'part', node: <foo />, value: { x: 'foo' }, path: '$#X.y:2' },
    ])
  ).toThrowErrorMatchingInlineSnapshot(
    `"\\"abc\\" at $#X.y:1 is invalid, only <[A, foo]/> allowed"`
  );
});

it('throw if number contained', () => {
  expect(() =>
    valuesOfAFoo([
      { type: 'part', node: <A />, value: { x: 'a' }, path: '$#X.y:0' },
      { type: 'text', node: 123, value: '123', path: '$#X.y:1' },
      { type: 'part', node: <foo />, value: { x: 'foo' }, path: '$#X.y:2' },
    ])
  ).toThrowErrorMatchingInlineSnapshot(
    `"123 at $#X.y:1 is invalid, only <[A, foo]/> allowed"`
  );
});

it('throw if invalid general element contained', () => {
  expect(() =>
    valuesOfAFoo([
      { type: 'part', node: <A />, value: { x: 'a' }, path: '$#X.y:0' },
      { type: 'part', node: <xxx />, value: { x: 'x' }, path: '$#X.y:1' },
      { type: 'part', node: <foo />, value: { x: 'foo' }, path: '$#X.y:2' },
    ])
  ).toThrowErrorMatchingInlineSnapshot(
    `"<xxx /> at $#X.y:1 is invalid, only <[A, foo]/> allowed"`
  );
});

it('throw if invalid Native element contained', () => {
  expect(() =>
    valuesOfAFoo([
      { type: 'part', node: <A />, value: { x: 'a' }, path: '$#X.y:0' },
      { type: 'part', node: <C />, value: { x: 'c' }, path: '$#X.y:1' },
      { type: 'part', node: <foo />, value: { x: 'foo' }, path: '$#X.y:2' },
    ])
  ).toThrowErrorMatchingInlineSnapshot(
    `"<C /> at $#X.y:1 is invalid, only <[A, foo]/> allowed"`
  );
});
