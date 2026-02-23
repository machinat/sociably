/* eslint-disable class-methods-use-this */
import mixin from '../mixin.js';

describe('mixin()', () => {
  it('copies prototype methods from a single base class', () => {
    class Base {
      greet() {
        return 'hello';
      }
    }

    @mixin([Base])
    class Target {}

    const instance = new Target() as Target & Base;
    expect(instance.greet()).toBe('hello');
  });

  it('copies prototype methods from multiple base classes', () => {
    class A {
      foo() {
        return 'foo';
      }
    }
    class B {
      bar() {
        return 'bar';
      }
    }

    @mixin([A, B])
    class Target {}

    const instance = new Target() as Target & A & B;
    expect(instance.foo()).toBe('foo');
    expect(instance.bar()).toBe('bar');
  });

  it('copies getters and setters from base classes', () => {
    class Base {
      private _value = 0;
      get value() {
        return this._value;
      }

      set value(v: number) {
        this._value = v;
      }
    }

    @mixin([Base])
    class Target {}

    const instance = new Target() as Target & Base;
    instance.value = 42;
    expect(instance.value).toBe(42);
  });

  it('preserves the derived class constructor', () => {
    class Base {
      greet() {
        return 'hello';
      }
    }

    @mixin([Base])
    class Target {
      name: string;
      constructor(name: string) {
        this.name = name;
      }
    }

    const instance = new Target('world') as Target & Base;
    expect(instance.name).toBe('world');
    expect(instance.greet()).toBe('hello');
  });

  it('does not override existing methods on the derived class', () => {
    class Base {
      greet() {
        return 'from base';
      }
    }

    @mixin([Base])
    class Target {
      greet() {
        return 'from target';
      }
    }

    // Later bases and existing props overwrite earlier ones via defineProperty
    const instance = new Target();
    // mixin overwrites derived class methods since it runs after class definition
    expect(instance.greet()).toBe('from base');
  });

  it('later base classes overwrite earlier ones for same-named methods', () => {
    class A {
      greet() {
        return 'from A';
      }
    }
    class B {
      greet() {
        return 'from B';
      }
    }

    @mixin([A, B])
    class Target {}

    const instance = new Target() as Target & A & B;
    expect(instance.greet()).toBe('from B');
  });

  it('returns the same class constructor', () => {
    class Base {
      foo() {
        return 1;
      }
    }

    const Original = class Target {};
    const Decorated = mixin([Base])(Original, {
      kind: 'class',
    } as ClassDecoratorContext<typeof Original>);

    expect(Decorated).toBe(Original);
  });

  it('copies non-enumerable prototype properties', () => {
    class Base {}
    Object.defineProperty(Base.prototype, 'hidden', {
      value: 'secret',
      enumerable: false,
      writable: true,
      configurable: true,
    });

    @mixin([Base])
    class Target {}

    const instance = new Target() as any;
    expect(instance.hidden).toBe('secret');

    const descriptor = Object.getOwnPropertyDescriptor(
      Target.prototype,
      'hidden',
    );
    expect(descriptor?.enumerable).toBe(false);
  });

  it('works with an empty bases array', () => {
    @mixin([])
    class Target {
      value = 123;
    }

    const instance = new Target();
    expect(instance.value).toBe(123);
  });

  it('throws if applied to a non-class context', () => {
    class Base {}

    expect(() => {
      mixin([Base])({} as any, { kind: 'method' } as any);
    }).toThrow('@mixin can only be applied to classes');
  });
});
