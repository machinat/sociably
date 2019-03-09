import { mixin, toJSONWithProto } from '../eventUtils';

describe('mixin(...protos)', () => {
  it('mixins all prototypes', () => {
    const protos = [
      { foo: 0 },
      {
        get bar() {
          return 1;
        },
      },
      {
        baz() {
          return 2;
        },
      },
    ];

    expect(mixin(...protos)).toEqual({
      foo: 0,
      bar: 1,
      baz: protos[2].baz,
    });
  });
});

describe('toJSONWithProto()', () => {
  it('return a object to be stringify with all props of "this" along prototype chain', () => {
    const proto1 = { foo: 1 };

    const proto2 = Object.create(proto1);
    proto2.bar = 2;

    const obj = Object.create(proto2);
    obj.baz = 3;

    expect(toJSONWithProto.call(obj)).toEqual({ foo: 1, bar: 2, baz: 3 });
  });
});
