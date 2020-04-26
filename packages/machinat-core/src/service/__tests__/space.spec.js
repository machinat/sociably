/* eslint-disable class-methods-use-this */
import { factory as moxyFactory } from 'moxy';
import ServiceSpace from '../space';
import ServiceScope from '../scope';
import {
  container,
  factory,
  provider,
  namedInterface,
  abstractInterface,
} from '../annotate';

const moxy = moxyFactory({ mockProperty: false });

const HELLO = namedInterface({ name: 'Hello' });
const staticGreeter = moxy({ hello: () => 'HI' });

const Foo = provider({ deps: [HELLO], lifetime: 'singleton' })(
  moxy(
    class Foo {
      foo() {
        return 'Foo';
      }
    }
  )
);

const Bar = abstractInterface()(
  class BarAbstract {
    bar() {
      throw new Error('too abstract');
    }
  }
);

const BarImpl = provider({
  deps: [Foo],
  lifetime: 'scoped',
})(
  moxy(
    class BarImpl {
      bar() {
        return 'BarImpl';
      }
    }
  )
);

const BAZ = namedInterface({ name: 'Baz' });
const Baz = class Baz {
  baz() {
    return 'Baz';
  }
};
const bazFactory = factory({ deps: [Foo, Bar], lifetime: 'transient' })(
  moxy(() => new Baz())
);

const myContainer = container({
  deps: [HELLO, Foo, Bar, BAZ],
})(
  moxy(
    (greeter, foo, bar, baz) =>
      `${greeter.hello()} ${foo.foo()} ${bar.bar()} ${baz.baz()}`
  )
);

beforeEach(() => {
  Foo.mock.reset();
  BarImpl.mock.reset();
  bazFactory.mock.reset();
  myContainer.mock.reset();
});

it('provide services bound in bindings', () => {
  const space = new ServiceSpace(
    [
      { provide: Bar, withProvider: BarImpl },
      { provide: BAZ, withProvider: bazFactory },
    ],
    [Foo, { provide: HELLO, withValue: staticGreeter }]
  );
  space.bootstrap(null);

  expect(Foo.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.mock).not.toHaveBeenCalled();

  const scope = space.createScope('test');
  expect(scope).toBeInstanceOf(ServiceScope);

  expect(scope.injectContainer(myContainer)).toBe('HI Foo BarImpl Baz');

  const [greeter, foo, bar, baz] = scope.useServices([HELLO, Foo, Bar, BAZ]);
  expect(greeter).toBe(staticGreeter);
  expect(foo).toBeInstanceOf(Foo);
  expect(bar).toBeInstanceOf(BarImpl);
  expect(baz).toBeInstanceOf(Baz);

  expect(Foo.mock).toHaveBeenCalledTimes(1);
  expect(Foo.mock).toHaveBeenCalledWith(greeter);

  expect(BarImpl.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.mock).toHaveBeenCalledWith(foo);

  expect(bazFactory.mock).toHaveBeenCalledTimes(2);
  expect(bazFactory.mock).toHaveBeenCalledWith(foo, bar);

  expect(myContainer.mock).toHaveBeenCalledTimes(1);
  expect(myContainer.mock).toHaveBeenCalledWith(
    greeter,
    foo,
    bar,
    expect.any(Baz)
  );
});

test('registered bindings prioritize to bindings from module', () => {
  const MyFoo = provider({
    deps: [Bar, BAZ],
    lifetime: 'singleton',
  })(
    moxy(
      class MyFoo {
        foo() {
          return 'MyFoo';
        }
      }
    )
  );
  const AnotherBar = provider({
    deps: [BAZ],
    lifetime: 'singleton',
  })(
    moxy(
      class AnotherBar {
        bar() {
          return 'AnotherBar';
        }
      }
    )
  );
  const fakeBaz = moxy({ baz: () => 'NO_BAZ' });

  const space = new ServiceSpace(
    [
      { provide: HELLO, withValue: staticGreeter },
      Foo,
      { provide: Bar, withProvider: BarImpl },
      { provide: BAZ, withProvider: bazFactory },
    ],
    [
      { provide: Foo, withProvider: MyFoo },
      { provide: Bar, withProvider: AnotherBar },
      { provide: BAZ, withValue: fakeBaz },
    ]
  );
  space.bootstrap(null);

  const scope = space.createScope('test');
  expect(scope.injectContainer(myContainer)).toBe('HI MyFoo AnotherBar NO_BAZ');

  const [foo, bar, baz] = scope.useServices([Foo, Bar, BAZ]);
  expect(foo).toBeInstanceOf(MyFoo);
  expect(bar).toBeInstanceOf(AnotherBar);
  expect(baz).toBe(fakeBaz);

  expect(MyFoo.mock).toHaveBeenCalledTimes(1);
  expect(MyFoo.mock).toHaveBeenCalledWith(bar, baz);
  expect(Foo.mock).not.toHaveBeenCalled();

  expect(AnotherBar.mock).toHaveBeenCalledTimes(1);
  expect(AnotherBar.mock).toHaveBeenCalledWith(baz);
  expect(BarImpl.mock).not.toHaveBeenCalled();

  expect(bazFactory.mock).not.toHaveBeenCalled();

  expect(myContainer.mock).toHaveBeenCalledTimes(1);
  expect(myContainer.mock).toHaveBeenCalledWith(staticGreeter, foo, bar, baz);
});

it('throw if bindings conflicted', () => {
  const someBar = { bar: () => '🍻' };
  expect(
    () =>
      new ServiceSpace(
        [
          { provide: Bar, withProvider: BarImpl },
          { provide: Bar, withValue: someBar },
        ],
        [Foo, { provide: BAZ, withValue: bazFactory }]
      )
  ).toThrowErrorMatchingInlineSnapshot(
    `"BarAbstract is already bound on default branch"`
  );

  expect(
    () =>
      new ServiceSpace(
        [Foo, { provide: BAZ, withValue: bazFactory }],
        [
          { provide: Bar, withProvider: BarImpl },
          { provide: Bar, withValue: someBar },
        ]
      )
  ).toThrowErrorMatchingInlineSnapshot(
    `"BarAbstract is already bound on default branch"`
  );
});

it('throw if provider dependencies not bound when bootstrap', () => {
  expect(() =>
    new ServiceSpace([], [BarImpl]).bootstrap(null)
  ).toThrowErrorMatchingInlineSnapshot(`"Foo is not bound"`);
  expect(() =>
    new ServiceSpace(
      [{ provide: HELLO, withValue: staticGreeter }, Foo],
      [{ provide: BAZ, platforms: ['A', 'B'], withProvider: bazFactory }]
    ).bootstrap(null)
  ).toThrowErrorMatchingInlineSnapshot(`"BarAbstract is not bound"`);
});

it('throw if invalid binding received', () => {
  expect(() => new ServiceSpace([Bar], [])).toThrowErrorMatchingInlineSnapshot(`
"invalid binding (class BarAbstract {
  bar() {
    throw new Error('too abstract');
  }

})"
`);
  expect(
    () => new ServiceSpace([{ provide: class Bae {}, withValue: 'bae~' }], [])
  ).toThrowErrorMatchingInlineSnapshot(
    `"class Bae {} is not a valid interface to provide"`
  );
  expect(
    () => new ServiceSpace([{ provide: Bar, withTea: 'Oooooolong' }], [])
  ).toThrowErrorMatchingInlineSnapshot(
    `"either withProvider or withValue must be provided within binding"`
  );
  expect(
    () =>
      new ServiceSpace([{ provide: Bar, withProvider: { star: 'bucks' } }], [])
  ).toThrowErrorMatchingInlineSnapshot(`"invalid provider [object Object]"`);
});

it('throw circular dependent provider found when bootstrap', () => {
  const SelfDependentFoo = provider({
    deps: [Foo],
    facotry: () => {},
    lifetime: 'scoped',
  })(class SelfDependentFoo {});

  expect(() =>
    new ServiceSpace(
      [],
      [{ provide: Foo, withProvider: SelfDependentFoo }]
    ).bootstrap(null)
  ).toThrowErrorMatchingInlineSnapshot(
    `"SelfDependentFoo is circular dependent"`
  );

  const CircularDependentFoo = provider({
    deps: [Bar],
    facotry: () => {},
    lifetime: 'scoped',
  })(class CircularDependentFoo {});
  expect(() =>
    new ServiceSpace(
      [{ provide: Foo, withProvider: CircularDependentFoo }],
      [{ provide: Bar, withProvider: BarImpl }]
    ).bootstrap(null)
  ).toThrowErrorMatchingInlineSnapshot(
    `"CircularDependentFoo is circular dependent"`
  );
});

it('provide service bound on specified platform within corresponded scope', () => {
  const space = new ServiceSpace(
    [{ provide: HELLO, withValue: staticGreeter }],
    [
      Foo,
      { provide: Bar, withProvider: BarImpl },
      { provide: BAZ, platforms: ['A', 'B'], withProvider: bazFactory },
    ]
  );
  space.bootstrap(null);

  const bazContainer = container({ deps: [BAZ] })(baz => baz.baz());

  const scopeA = space.createScope('A');
  expect(scopeA.injectContainer(bazContainer)).toBe('Baz');
  let [baz] = scopeA.useServices([BAZ]);
  expect(baz).toBeInstanceOf(Baz);

  const scopeB = space.createScope('B');
  expect(scopeA.injectContainer(bazContainer)).toBe('Baz');
  [baz] = scopeB.useServices([BAZ]);
  expect(baz).toBeInstanceOf(Baz);

  const scopeC = space.createScope('C');
  expect(() =>
    scopeC.injectContainer(bazContainer)
  ).toThrowErrorMatchingInlineSnapshot(`"Baz is not bound"`);
  expect(() => scopeC.useServices([BAZ])).toThrowErrorMatchingInlineSnapshot(
    `"Baz is not bound"`
  );
});

it('provide service bound on specified platform prior to default one', () => {
  const fooCat = { foo: () => 'FOO_MEOW' };
  const fooBird = { foo: () => 'FOO_TWEET' };
  const fooWhale = { foo: () => 'FOO_SONAR' };

  const space = new ServiceSpace(
    [{ provide: Bar, withProvider: BarImpl }],
    [
      { provide: Foo, withValue: fooCat },
      { provide: Foo, platforms: ['sky', 'on_the_tree'], withValue: fooBird },
      { provide: Foo, platforms: ['under_water'], withValue: fooWhale },
    ]
  );
  space.bootstrap(null);

  const fooContainer = container({ deps: [Foo] })(foo => foo.foo());

  let scope = space.createScope();
  expect(scope.injectContainer(fooContainer)).toBe('FOO_MEOW');
  let [foo] = scope.useServices([Foo]);
  expect(foo).toBe(fooCat);

  scope = space.createScope('sky');
  expect(scope.injectContainer(fooContainer)).toBe('FOO_TWEET');
  [foo] = scope.useServices([Foo]);
  expect(foo).toBe(fooBird);

  scope = space.createScope('on_the_tree');
  expect(scope.injectContainer(fooContainer)).toBe('FOO_TWEET');
  [foo] = scope.useServices([Foo]);
  expect(foo).toBe(fooBird);

  scope = space.createScope('under_water');
  expect(scope.injectContainer(fooContainer)).toBe('FOO_SONAR');
  [foo] = scope.useServices([Foo]);
  expect(foo).toBe(fooWhale);

  scope = space.createScope('over_the_rainbow');
  expect(scope.injectContainer(fooContainer)).toBe('FOO_MEOW');
  [foo] = scope.useServices([Foo]);
  expect(foo).toBe(fooCat);
});

it('throw if bindings conflicted on specified platform when bootstrap', () => {
  const someBar = { bar: () => 'zzz' };
  expect(() =>
    new ServiceSpace(
      [
        { provide: Bar, platforms: ['a', 'b'], withProvider: BarImpl },
        { provide: Bar, platforms: ['b', 'c'], withValue: someBar },
      ],
      [Foo]
    ).bootstrap(null)
  ).toThrowErrorMatchingInlineSnapshot(
    `"BarAbstract is already bound on \\"b\\" platform"`
  );

  expect(() =>
    new ServiceSpace(
      [Foo],
      [
        { provide: Bar, platforms: ['a', 'b'], withValue: someBar },
        { provide: Bar, platforms: ['b', 'c'], withProvider: BarImpl },
      ]
    ).bootstrap(null)
  ).toThrowErrorMatchingInlineSnapshot(
    `"BarAbstract is already bound on \\"b\\" platform"`
  );
});

it('throw if unbound service usage required', () => {
  const space = new ServiceSpace(
    [
      { provide: HELLO, withValue: staticGreeter },
      { provide: Bar, withProvider: BarImpl },
    ],
    [Foo]
  );
  space.bootstrap(null);

  const fooContainer = container({ deps: [Foo, Bar, BAZ] })(() => 'BOOM');

  const scope = space.createScope('test');
  expect(() =>
    scope.injectContainer(fooContainer)
  ).toThrowErrorMatchingInlineSnapshot(`"Baz is not bound"`);

  expect(() =>
    scope.useServices([Foo, Bar, BAZ])
  ).toThrowErrorMatchingInlineSnapshot(`"Baz is not bound"`);
});

test('optional dependency', () => {
  const space = new ServiceSpace(
    [{ provide: HELLO, withValue: staticGreeter }, Foo],
    [{ provide: Bar, withProvider: BarImpl }]
  );
  space.bootstrap(null);

  const optionalDepsContainer = container({
    deps: [
      Foo,
      { require: Bar, optional: true },
      { require: BAZ, optional: true },
    ],
  })(
    (foo, bar, baz) =>
      `${foo.foo()} ${bar ? bar.bar() : 'x'} ${baz ? baz.baz() : 'x'}`
  );

  const scope = space.createScope('test');
  expect(scope.injectContainer(optionalDepsContainer)).toBe('Foo BarImpl x');

  const [foo, bar, baz] = scope.useServices([
    Foo,
    { require: Bar, optional: true },
    { require: BAZ, optional: true },
  ]);
  expect(foo).toBeInstanceOf(Foo);
  expect(bar).toBeInstanceOf(BarImpl);
  expect(baz).toBe(null);
});

it('use the same instance of the same provider on different interface', () => {
  const MusicalBar = namedInterface({ name: 'MusicalBar' });
  const JazzBar = namedInterface({ name: 'JazzBar' });

  const space = new ServiceSpace(
    [{ provide: HELLO, withValue: staticGreeter }, Foo],
    [
      { provide: Bar, withProvider: BarImpl },
      { provide: JazzBar, withProvider: BarImpl },
      { provide: MusicalBar, withProvider: BarImpl },
    ]
  );
  space.bootstrap(null);

  const scope = space.createScope('test');
  const [bar, jazzBar, musicalBar] = scope.useServices([
    Bar,
    JazzBar,
    MusicalBar,
  ]);

  expect(bar).toBeInstanceOf(BarImpl);
  expect(jazzBar).toBe(bar);
  expect(musicalBar).toBe(bar);

  expect(BarImpl.mock).toHaveBeenCalledTimes(1);
});

test('lifecycle of services of different lifetime', () => {
  const space = new ServiceSpace(
    [Foo, { provide: Bar, withProvider: BarImpl }],
    [
      { provide: BAZ, withProvider: bazFactory },
      { provide: HELLO, withValue: staticGreeter },
    ]
  );
  space.bootstrap(null);

  expect(Foo.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.mock).not.toHaveBeenCalled();
  expect(bazFactory.mock).not.toHaveBeenCalled();

  const bootstrapedFoo = Foo.mock.calls[0].instance;
  const services = [HELLO, Foo, Bar, BAZ];

  const scope1 = space.createScope('test');
  const [greeter1, foo1, bar1, baz1] = scope1.useServices(services);
  expect(greeter1).toBe(staticGreeter);
  expect(foo1).toBeInstanceOf(Foo);
  expect(foo1).toBe(bootstrapedFoo);
  expect(bar1).toBeInstanceOf(BarImpl);
  expect(baz1).toBeInstanceOf(Baz);

  const [greeter2, foo2, bar2, baz2] = scope1.useServices(services);
  expect(greeter2).toBe(staticGreeter);
  expect(foo2).toBe(foo1);
  expect(bar2).toBe(bar1);
  expect(baz2).not.toBe(baz1);

  const scope2 = space.createScope('test');
  const [greeter3, foo3, bar3, baz3] = scope2.useServices(services);

  expect(greeter3).toBe(staticGreeter);
  expect(foo3).toBe(foo1);
  expect(bar3).not.toBe(bar1);
  expect(bar3).toBeInstanceOf(BarImpl);
  expect(baz3).not.toBe(baz1);
  expect(baz3).not.toBe(baz2);

  expect(Foo.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.mock).toHaveBeenCalledTimes(2);
  expect(bazFactory.mock).toHaveBeenCalledTimes(3);
});

test('provide multi interface as an array of bound value', () => {
  const MULTI_FOOD = namedInterface({ name: 'MultiFood', multi: true });
  const bistroFactory = factory({ lifetime: 'singleton', deps: [MULTI_FOOD] })(
    moxy(dishes => ({
      serve: () => dishes,
    }))
  );

  const meatFactory = factory({ lifetime: 'scoped' })(moxy(() => '🥩'));

  const burgerFactory = factory({
    lifetime: 'singleton',
    deps: [meatFactory],
  })(moxy(() => '🍔'));
  const hotdogFactory = factory({
    lifetime: 'scoped',
    deps: [meatFactory],
  })(moxy(() => '🌭'));

  const pizzaFactory = factory({ lifetime: 'singleton' })(moxy(() => '🍕'));
  const tacoFactory = factory({ lifetime: 'scoped' })(moxy(() => '🌮'));
  const ramenFactory = factory({ lifetime: 'transient' })(moxy(() => '🍜'));

  const space = new ServiceSpace(
    [
      meatFactory,
      { provide: Bar, withProvider: bistroFactory },
      { provide: MULTI_FOOD, withProvider: burgerFactory },
      { provide: MULTI_FOOD, withProvider: pizzaFactory },
      { provide: MULTI_FOOD, withProvider: tacoFactory },
      { provide: MULTI_FOOD, withValue: '🍝' },
    ],
    [
      { provide: MULTI_FOOD, withProvider: pizzaFactory },
      { provide: MULTI_FOOD, withProvider: hotdogFactory },
      { provide: MULTI_FOOD, withProvider: ramenFactory },
      { provide: MULTI_FOOD, withValue: '🥙' },
    ]
  );
  space.bootstrap(null);

  expect(meatFactory.mock).toHaveBeenCalledTimes(1);
  expect(bistroFactory.mock).toHaveBeenCalledTimes(1);
  expect(bistroFactory.mock).toHaveBeenLastCalledWith([
    '🍔',
    '🍕',
    '🌮',
    '🍝',
    '🍕',
    '🌭',
    '🍜',
    '🥙',
  ]);

  expect(burgerFactory.mock).toHaveBeenCalledTimes(1);
  expect(burgerFactory.mock).toHaveBeenCalledWith('🥩');

  expect(hotdogFactory.mock).toHaveBeenCalledTimes(1);
  expect(hotdogFactory.mock).toHaveBeenCalledWith('🥩');

  expect(tacoFactory.mock).toHaveBeenCalledTimes(1);
  expect(pizzaFactory.mock).toHaveBeenCalledTimes(1);
  expect(ramenFactory.mock).toHaveBeenCalledTimes(1);

  const scope = space.createScope('test');
  expect(scope.useServices([MULTI_FOOD])).toEqual([
    ['🍔', '🍕', '🌮', '🍝', '🍕', '🌭', '🍜', '🥙'],
  ]);

  expect(burgerFactory.mock).toHaveBeenCalledTimes(1);
  expect(pizzaFactory.mock).toHaveBeenCalledTimes(1);
  expect(hotdogFactory.mock).toHaveBeenCalledTimes(2);
  expect(tacoFactory.mock).toHaveBeenCalledTimes(2);
  expect(ramenFactory.mock).toHaveBeenCalledTimes(2);
});

test('provide multi interface as an empty array if no value bound', () => {
  const MULTI_FOO = namedInterface({ name: 'MultiFoo', multi: true });
  const needFooFactory = factory({ lifetime: 'singleton', deps: [MULTI_FOO] })(
    moxy(() => ({}))
  );

  const space = new ServiceSpace(
    [{ provide: HELLO, withValue: staticGreeter }, Foo],
    [needFooFactory]
  );
  space.bootstrap(null);

  expect(needFooFactory.mock).toHaveBeenCalledTimes(1);
  expect(needFooFactory.mock).toHaveBeenCalledWith([]);

  const scope = space.createScope('test');
  expect(scope.useServices([MULTI_FOO])).toEqual([[]]);
});

test('inject time provision', () => {
  const space = new ServiceSpace(
    [Foo, { provide: HELLO, withValue: staticGreeter }],
    [
      { provide: Bar, withProvider: BarImpl },
      { provide: BAZ, withProvider: bazFactory },
    ]
  );
  space.bootstrap(null);

  const myFoo = { my: 'foo' };
  const myBar = { my: 'bar' };
  const myBaz = { my: 'baz' };
  const myGreeter = { hello: 'WORLD' };
  const injectTimeProvisions = new Map([
    [Foo, myFoo],
    [Bar, myBar],
    [BAZ, myBaz],
    [HELLO, myGreeter],
  ]);

  const scope = space.createScope('test');
  const [greeter, foo, bar, baz] = scope.useServices(
    [HELLO, Foo, Bar, BAZ],
    injectTimeProvisions
  );

  expect(foo).toBe(myFoo);
  expect(bar).toBe(myBar);
  expect(baz).toBe(myBaz);
  expect(greeter).toBe(myGreeter);

  expect(
    scope.injectContainer(
      container({ deps: [HELLO, Foo, Bar, BAZ] })((...args) => args),
      injectTimeProvisions
    )
  ).toEqual([greeter, foo, bar, baz]);

  expect(Foo.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.mock).not.toHaveBeenCalled();
  expect(bazFactory.mock).not.toHaveBeenCalled();
});

test('boostrap time provision', () => {
  const BOOTSTRAP_TIME_INTERFACE = namedInterface({ name: 'BOO' });
  const BooConsumer = provider({
    deps: [BOOTSTRAP_TIME_INTERFACE],
    lifetime: 'singleton',
  })(moxy(class BooConsumer {}));

  const space = new ServiceSpace(
    [Foo, { provide: HELLO, withValue: staticGreeter }],
    [
      { provide: Bar, withProvider: BarImpl },
      { provide: BAZ, withProvider: bazFactory },
      BooConsumer,
    ]
  );
  space.bootstrap(new Map([[BOOTSTRAP_TIME_INTERFACE, 'boooo~']]));

  expect(BooConsumer.mock).toHaveBeenCalledTimes(1);
  expect(BooConsumer.mock).toHaveBeenCalledWith('boooo~');

  expect(() =>
    space.createScope('test').useServices([BOOTSTRAP_TIME_INTERFACE])
  ).toThrowErrorMatchingInlineSnapshot(`"BOO is not bound"`);
});

test('require underlying ServiceScope', () => {
  const scopeConsumer = container({ deps: [ServiceScope] })(moxy(() => ({})));

  const space = new ServiceSpace(
    [{ provide: HELLO, withValue: staticGreeter }],
    [Foo]
  );
  space.bootstrap(null);

  const scope = space.createScope('test');
  scope.injectContainer(scopeConsumer);

  expect(scopeConsumer.mock).toHaveBeenCalledTimes(1);
  expect(scopeConsumer.mock).toHaveBeenCalledWith(scope);

  const [requiredScope] = scope.useServices([ServiceScope]);
  expect(requiredScope).toBe(scope);
});
