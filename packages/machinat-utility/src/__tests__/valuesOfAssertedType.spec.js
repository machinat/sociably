import Machinat from 'machinat';
import valuesOfAssertedType from '../valuesOfAssertedType';

const A = () => 'a';
const B = () => 'b';
const C = () => 'c';

const render = nodes =>
  nodes.map(element => ({
    element,
    value:
      typeof element === 'string' || typeof element === 'number'
        ? element
        : typeof element.type === 'string'
        ? element.type
        : element.type(),
  }));

it('render and return values', () => {
  expect(
    valuesOfAssertedType(A, B, C, 'foo', 'bar')(
      [<A />, <foo />, <B />, <bar />, <C />],
      render,
      '.someprop'
    )
  ).toEqual(['a', 'foo', 'b', 'bar', 'c']);
});

const valuesOfAFoo = valuesOfAssertedType(A, 'foo');

it('throw if string contained', () => {
  expect(() =>
    valuesOfAFoo([<A />, 'abc', <foo />], render, '.someprop')
  ).toThrowErrorMatchingInlineSnapshot(
    `"\\"abc\\" is invalid in .someprop, only <[A, foo]/> allowed"`
  );
});

it('throw if number contained', () => {
  expect(() =>
    valuesOfAFoo([<A />, 123, <foo />], render, '.someprop')
  ).toThrowErrorMatchingInlineSnapshot(`"element.type is not a function"`);
});

it('throw if invalid general element contained', () => {
  expect(() =>
    valuesOfAFoo([<A />, <xxx />, <foo />], render, '.someprop')
  ).toThrowErrorMatchingInlineSnapshot(
    `"<xxx /> is invalid in .someprop, only <[A, foo]/> allowed"`
  );
});

it('throw if invalid Native element contained', () => {
  expect(() =>
    valuesOfAFoo([<A />, <C />, <foo />], render, '.someprop')
  ).toThrowErrorMatchingInlineSnapshot(
    `"<C /> is invalid in .someprop, only <[A, foo]/> allowed"`
  );
});
