import getObjectValueByPath from '../getObjectValueByPath.js';

test.each([
  [{ foo: 'bar' }, '$.foo', 'bar'],
  [{ foo: { bar: 'baz' } }, '$.foo.bar', 'baz'],
  [{ foo: [{ id: 1 }, { id: 2 }, { id: 3 }] }, '$.foo.*.id', '1,2,3'],
  [{ foo: 'bar' }, 'foo', null],
  [{}, '$.foo', null],
  [{ foo: 'bar' }, '$.foo.*.baz', null],
])('get value on path', (object, path, expectedValue) => {
  expect(getObjectValueByPath(object, path)).toBe(expectedValue);
});
