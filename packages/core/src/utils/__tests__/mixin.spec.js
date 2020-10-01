import mixin from '../mixin';

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
