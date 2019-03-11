import toJSONWithProto from '../toJSONWithProto';

it('return a object to be stringify with all props of "this" along prototype chain', () => {
  const proto1 = { foo: 1 };

  const proto2 = Object.create(proto1);
  proto2.bar = 2;

  const obj = Object.create(proto2);
  obj.baz = 3;

  expect(toJSONWithProto.call(obj)).toEqual({ foo: 1, bar: 2, baz: 3 });
});
