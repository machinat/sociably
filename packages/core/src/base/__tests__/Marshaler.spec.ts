/* eslint-disable class-methods-use-this */
import { BaseMarshaler } from '../Marshaler.js';

class Foo {
  static typeName = 'Foo';
  static fromJSONValue(value) {
    return new Foo(value.foo);
  }

  _foo: any;
  constructor(foo) {
    this._foo = foo;
  }

  typeName() {
    return 'Foo';
  }

  toJSONValue() {
    return { foo: this._foo };
  }
}

class Bar {
  static typeName = 'Bar';
  static fromJSONValue(value) {
    return new Bar(value.bar);
  }

  _bar: any;
  constructor(bar) {
    this._bar = bar;
  }

  typeName() {
    return 'Bar';
  }

  toJSONValue() {
    return { bar: this._bar };
  }
}

it('marshal/unmarshal custom types', () => {
  const marshaler = new BaseMarshaler([Foo, Bar]);

  const valueWithClasses = {
    foo: new Foo(1),
    bar: new Bar(2),
    baz: 3,
  };

  const plainValue = marshaler.marshal(valueWithClasses);
  expect(plainValue).toMatchInlineSnapshot(`
    {
      "bar": {
        "$type": "Bar",
        "$value": {
          "bar": 2,
        },
      },
      "baz": 3,
      "foo": {
        "$type": "Foo",
        "$value": {
          "foo": 1,
        },
      },
    }
  `);

  expect(marshaler.unmarshal(plainValue)).toStrictEqual(valueWithClasses);
});
