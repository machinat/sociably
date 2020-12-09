/* eslint-disable class-methods-use-this */
import moxy from '@moxyjs/moxy';
import ServiceSpace from '../space';
import ServiceScope from '../scope';
import {
  makeContainer,
  makeFactoryProvider,
  makeClassProvider,
  makeInterface,
} from '../annotate';

const HELLO = makeInterface<{ hello(): string }>({ name: 'Hello' });
const staticGreeter = moxy({ hello: () => 'HI' });

const Foo = moxy(
  makeClassProvider({ deps: [HELLO], lifetime: 'singleton' })(
    class Foo {
      foo() {
        return 'Foo';
      }
    }
  )
);

const Bar = makeInterface<{ bar(): string }>({ name: 'BAR' });

const BarImpl = moxy(
  makeClassProvider({ deps: [Foo], lifetime: 'scoped' })(
    class BarImpl {
      bar() {
        return 'BarImpl';
      }
    }
  )
);

const BAZ = makeInterface<{ baz(): string }>({ name: 'Baz' });
const Baz = class Baz {
  baz() {
    return 'Baz';
  }
};
const bazFactory = moxy(
  makeFactoryProvider({ deps: [Foo, Bar], lifetime: 'transient' })(
    () => new Baz()
  )
);

const myContainer = moxy(
  makeContainer({ deps: [HELLO, Foo, Bar, BAZ] as const })(
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
  const space = new ServiceSpace(null, [
    Foo,
    { provide: HELLO, withValue: staticGreeter },
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazFactory },
  ]);
  space.bootstrap();

  expect(Foo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory.mock).not.toHaveBeenCalled();

  const scope = space.createScope();
  expect(scope).toBeInstanceOf(ServiceScope);

  expect(scope.injectContainer(myContainer)).toBe('HI Foo BarImpl Baz');

  const [greeter, foo, bar, baz] = scope.useServices([HELLO, Foo, Bar, BAZ]);
  expect(greeter).toBe(staticGreeter);
  expect(foo).toBeInstanceOf(Foo);
  expect(bar).toBeInstanceOf(BarImpl);
  expect(baz).toBeInstanceOf(Baz);

  expect(Foo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(Foo.$$factory.mock).toHaveBeenCalledWith(greeter);

  expect(BarImpl.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory.mock).toHaveBeenCalledWith(foo);

  expect(bazFactory.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(bazFactory.$$factory.mock).toHaveBeenCalledWith(foo, bar);

  expect(myContainer.mock).toHaveBeenCalledTimes(1);
  expect(myContainer.mock).toHaveBeenCalledWith(
    greeter,
    foo,
    bar,
    expect.any(Baz)
  );
});

test('new bindings prioritize to bindings from base space', () => {
  const MyFoo = moxy(
    makeClassProvider({ deps: [Bar, BAZ], lifetime: 'singleton' })(
      class MyFoo {
        foo() {
          return 'MyFoo';
        }
      }
    )
  );
  const AnotherBar = moxy(
    makeClassProvider({ deps: [BAZ], lifetime: 'singleton' })(
      class AnotherBar {
        bar() {
          return 'AnotherBar';
        }
      }
    )
  );
  const fakeBaz = moxy({ baz: () => 'NO_BAZ' });

  const baseSpace = new ServiceSpace(null, [
    { provide: HELLO, withValue: staticGreeter },
    Foo,
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazFactory },
  ]);
  const space = new ServiceSpace(baseSpace, [
    { provide: Foo, withProvider: MyFoo },
    { provide: Bar, withProvider: AnotherBar },
    { provide: BAZ, withValue: fakeBaz },
  ]);
  space.bootstrap();

  const scope = space.createScope();
  expect(scope.injectContainer(myContainer)).toBe('HI MyFoo AnotherBar NO_BAZ');

  const [foo, bar, baz] = scope.useServices([Foo, Bar, BAZ]);
  expect(foo).toBeInstanceOf(MyFoo);
  expect(bar).toBeInstanceOf(AnotherBar);
  expect(baz).toBe(fakeBaz);

  expect(MyFoo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(MyFoo.$$factory.mock).toHaveBeenCalledWith(bar, baz);
  expect(Foo.$$factory.mock).not.toHaveBeenCalled();

  expect(AnotherBar.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(AnotherBar.$$factory.mock).toHaveBeenCalledWith(baz);
  expect(BarImpl.$$factory.mock).not.toHaveBeenCalled();

  expect(bazFactory.$$factory.mock).not.toHaveBeenCalled();

  expect(myContainer.mock).toHaveBeenCalledTimes(1);
  expect(myContainer.mock).toHaveBeenCalledWith(staticGreeter, foo, bar, baz);
});

it('throw if bindings conflicted', () => {
  const someBar = { bar: () => '🍻' };
  expect(
    () =>
      new ServiceSpace(null, [
        Foo,
        { provide: BAZ, withValue: bazFactory },
        { provide: Bar, withProvider: BarImpl },
        { provide: Bar, withValue: someBar },
      ])
  ).toThrowErrorMatchingInlineSnapshot(`"BAR is already bound to BarImpl"`);

  expect(
    () =>
      new ServiceSpace(
        new ServiceSpace(null, [Foo, { provide: BAZ, withValue: bazFactory }]),
        [
          { provide: Bar, withProvider: BarImpl },
          { provide: Bar, withValue: someBar },
        ]
      )
  ).toThrowErrorMatchingInlineSnapshot(`"BAR is already bound to BarImpl"`);
});

it('throw if provider dependencies is not bound', () => {
  expect(() =>
    new ServiceSpace(null, [BarImpl]).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(`"Foo is not bound"`);
  expect(() =>
    new ServiceSpace(
      new ServiceSpace(null, [
        { provide: HELLO, withValue: staticGreeter },
        Foo,
      ]),
      [{ provide: BAZ, withProvider: bazFactory }]
    ).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(`"BAR is not bound"`);
});

it('throw if invalid binding received', () => {
  expect(
    () => new ServiceSpace(null, [Bar] as never)
  ).toThrowErrorMatchingInlineSnapshot(`"invalid provider BAR"`);
  expect(
    () =>
      new ServiceSpace(null, [
        { provide: class Bae {}, withValue: 'bae~' } as never,
      ])
  ).toThrowErrorMatchingInlineSnapshot(`"invalid interface Bae"`);
  expect(
    () =>
      new ServiceSpace(null, [{ provide: Bar, withTea: 'Oooooolong' } as never])
  ).toThrowErrorMatchingInlineSnapshot(
    `"either withProvider or withValue must be provided within binding"`
  );
  expect(
    () =>
      new ServiceSpace(null, [
        { provide: Bar, withProvider: { star: 'bucks' } as never },
      ])
  ).toThrowErrorMatchingInlineSnapshot(`"invalid provider [object Object]"`);
});

it('throw circular dependent provider found when bootstrap', () => {
  const SelfDependentFoo = makeClassProvider({
    deps: [Foo],
    lifetime: 'scoped',
  })(class SelfDependentFoo {});

  expect(() =>
    new ServiceSpace(null, [
      { provide: Foo, withProvider: SelfDependentFoo },
    ]).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(
    `"SelfDependentFoo is circular dependent"`
  );

  const CircularDependentFoo = makeClassProvider({
    deps: [Bar],
    lifetime: 'scoped',
  })(class CircularDependentFoo {});
  expect(() =>
    new ServiceSpace(null, [
      { provide: Foo, withProvider: CircularDependentFoo },
      { provide: Bar, withProvider: BarImpl },
    ]).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(
    `"CircularDependentFoo is circular dependent"`
  );
});

it('provide branched interface with a map of platform and service', () => {
  const branchedMammal = makeInterface({
    name: 'FooMammal',
    branched: true,
  });

  const fooCat = { foo: () => 'FOO_MEOW' };
  const fooCatFactory = makeFactoryProvider({ lifetime: 'transient' })(
    () => fooCat
  );
  const fooBird = { foo: () => 'FOO_TWEET' };
  const fooWhale = { foo: () => 'FOO_SONAR' };

  const space = new ServiceSpace(null, [
    { provide: branchedMammal, platform: 'cat', withProvider: fooCatFactory },
    { provide: branchedMammal, platform: 'bird', withValue: fooBird },
    { provide: branchedMammal, platform: 'whale', withValue: fooWhale },
  ]);
  space.bootstrap();

  const scope = space.createScope();

  const expectedMap = new Map(
    Object.entries({
      cat: fooCat,
      bird: fooBird,
      whale: fooWhale,
    })
  );

  expect(scope.useServices([branchedMammal])).toEqual([expectedMap]);

  const mammalContainer = makeContainer({ deps: [branchedMammal] })(
    (mammals) => mammals
  );
  expect(scope.injectContainer(mammalContainer)).toEqual(expectedMap);
});

it('throw if bindings conflicted on specified platform', () => {
  const branchedMammal = makeInterface({
    name: 'FooMammal',
    branched: true,
  });

  const whiteCat = { foo: () => 'FOO_MEOW' };
  const whiteCatFactory = makeFactoryProvider({ lifetime: 'transient' })(
    () => whiteCat
  );
  const blackCat = { foo: () => 'FOO_MEOW' };
  expect(() =>
    new ServiceSpace(null, [
      {
        provide: branchedMammal,
        platform: 'cat',
        withProvider: whiteCatFactory,
      },
      { provide: branchedMammal, platform: 'cat', withValue: blackCat },
    ]).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(
    `"FooMammal is already bound to () => whiteCat on 'cat' platform"`
  );
});

it('registered branched bindings overrides the base one on platform', () => {
  const branchedMammal = makeInterface({
    name: 'FooMammal',
    branched: true,
  });

  const whiteCat = { foo: () => 'FOO_MEOW' };
  const blackCat = { foo: () => 'FOO_MEOW' };
  const space = new ServiceSpace(
    new ServiceSpace(null, [
      { provide: branchedMammal, platform: 'cat', withValue: whiteCat },
    ]),
    [{ provide: branchedMammal, platform: 'cat', withValue: blackCat }]
  );
  space.bootstrap();

  const scope = space.createScope();
  expect(scope.useServices([branchedMammal])).toEqual([
    new Map([['cat', blackCat]]),
  ]);
});

it('throw if unbound service usage required', () => {
  const space = new ServiceSpace(null, [
    Foo,
    { provide: HELLO, withValue: staticGreeter },
    { provide: Bar, withProvider: BarImpl },
  ]);
  space.bootstrap();

  const fooContainer = makeContainer({ deps: [Foo, Bar, BAZ] })(() => 'BOOM');

  const scope = space.createScope();
  expect(() =>
    scope.injectContainer(fooContainer)
  ).toThrowErrorMatchingInlineSnapshot(`"Baz is not bound"`);

  expect(() =>
    scope.useServices([Foo, Bar, BAZ])
  ).toThrowErrorMatchingInlineSnapshot(`"Baz is not bound"`);
});

test('optional dependency', () => {
  const space = new ServiceSpace(null, [
    { provide: HELLO, withValue: staticGreeter },
    Foo,
    { provide: Bar, withProvider: BarImpl },
  ]);
  space.bootstrap();

  const optionalDepsContainer = makeContainer({
    deps: [
      Foo,
      { require: Bar, optional: true },
      { require: BAZ, optional: true },
    ],
  })(
    (foo, bar, baz) =>
      `${foo.foo()} ${bar ? bar.bar() : 'x'} ${baz ? baz.baz() : 'x'}`
  );

  const scope = space.createScope();
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
  const MusicalBar = makeInterface({ name: 'MusicalBar' });
  const JazzBar = makeInterface({ name: 'JazzBar' });

  const space = new ServiceSpace(null, [
    { provide: HELLO, withValue: staticGreeter },
    Foo,
    { provide: Bar, withProvider: BarImpl },
    { provide: JazzBar, withProvider: BarImpl },
    { provide: MusicalBar, withProvider: BarImpl },
  ]);
  space.bootstrap();

  const scope = space.createScope();
  const [bar, jazzBar, musicalBar] = scope.useServices([
    Bar,
    JazzBar,
    MusicalBar,
  ]);

  expect(bar).toBeInstanceOf(BarImpl);
  expect(jazzBar).toBe(bar);
  expect(musicalBar).toBe(bar);

  expect(BarImpl.$$factory.mock).toHaveBeenCalledTimes(1);
});

test('lifecycle of services of different lifetime', () => {
  const space = new ServiceSpace(null, [
    Foo,
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazFactory },
    { provide: HELLO, withValue: staticGreeter },
  ]);
  space.bootstrap();

  expect(Foo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory.mock).not.toHaveBeenCalled();
  expect(bazFactory.$$factory.mock).not.toHaveBeenCalled();

  const bootstrapedFoo = Foo.$$factory.mock.calls[0].result;
  const services = [HELLO, Foo, Bar, BAZ];

  const scope1 = space.createScope();
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

  const scope2 = space.createScope();
  const [greeter3, foo3, bar3, baz3] = scope2.useServices(services);

  expect(greeter3).toBe(staticGreeter);
  expect(foo3).toBe(foo1);
  expect(bar3).not.toBe(bar1);
  expect(bar3).toBeInstanceOf(BarImpl);
  expect(baz3).not.toBe(baz1);
  expect(baz3).not.toBe(baz2);

  expect(Foo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(bazFactory.$$factory.mock).toHaveBeenCalledTimes(3);
});

test('provide multi interface as an array of bound value', () => {
  const MULTI_FOOD = makeInterface({ name: 'MultiFood', multi: true });
  const bistroFactory = moxy(
    makeFactoryProvider({
      lifetime: 'singleton',
      deps: [MULTI_FOOD],
    })((dishes) => ({
      serve: () => dishes,
    }))
  );

  const meatFactory = moxy(
    makeFactoryProvider({ lifetime: 'scoped' })(() => '🥩')
  );

  const burgerFactory = moxy(
    makeFactoryProvider({
      lifetime: 'singleton',
      deps: [meatFactory],
    })(() => '🍔')
  );
  const hotdogFactory = moxy(
    makeFactoryProvider({
      lifetime: 'scoped',
      deps: [meatFactory],
    })(() => '🌭')
  );

  const pizzaFactory = moxy(
    makeFactoryProvider({ lifetime: 'singleton' })(() => '🍕')
  );
  const tacoFactory = moxy(
    makeFactoryProvider({ lifetime: 'scoped' })(() => '🌮')
  );
  const ramenFactory = moxy(
    makeFactoryProvider({ lifetime: 'transient' })(() => '🍜')
  );

  const baseSpace = new ServiceSpace(null, [
    meatFactory,
    { provide: Bar, withProvider: bistroFactory },
    { provide: MULTI_FOOD, withProvider: burgerFactory },
    { provide: MULTI_FOOD, withProvider: pizzaFactory },
    { provide: MULTI_FOOD, withProvider: tacoFactory },
    { provide: MULTI_FOOD, withValue: '🍝' },
  ]);
  const space = new ServiceSpace(baseSpace, [
    { provide: MULTI_FOOD, withProvider: pizzaFactory },
    { provide: MULTI_FOOD, withProvider: hotdogFactory },
    { provide: MULTI_FOOD, withProvider: ramenFactory },
    { provide: MULTI_FOOD, withValue: '🥙' },
  ]);
  space.bootstrap();

  expect(meatFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(bistroFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(bistroFactory.$$factory.mock).toHaveBeenLastCalledWith([
    '🍔',
    '🍕',
    '🌮',
    '🍝',
    '🍕',
    '🌭',
    '🍜',
    '🥙',
  ]);

  expect(burgerFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(burgerFactory.$$factory.mock).toHaveBeenCalledWith('🥩');

  expect(hotdogFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(hotdogFactory.$$factory.mock).toHaveBeenCalledWith('🥩');

  expect(tacoFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(pizzaFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(ramenFactory.$$factory.mock).toHaveBeenCalledTimes(1);

  const scope = space.createScope();
  expect(scope.useServices([MULTI_FOOD])).toEqual([
    ['🍔', '🍕', '🌮', '🍝', '🍕', '🌭', '🍜', '🥙'],
  ]);

  expect(burgerFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(pizzaFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(hotdogFactory.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(tacoFactory.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(ramenFactory.$$factory.mock).toHaveBeenCalledTimes(2);
});

test('provide multi interface as an empty array if no value bound', () => {
  const MULTI_FOO = makeInterface({ name: 'MultiFoo', multi: true });
  const needFooFactory = moxy(
    makeFactoryProvider({
      lifetime: 'singleton',
      deps: [MULTI_FOO],
    })(() => ({}))
  );

  const space = new ServiceSpace(null, [
    { provide: HELLO, withValue: staticGreeter },
    Foo,
    needFooFactory,
  ]);
  space.bootstrap();

  expect(needFooFactory.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(needFooFactory.$$factory.mock).toHaveBeenCalledWith([]);

  const scope = space.createScope();
  expect(scope.useServices([MULTI_FOO])).toEqual([[]]);
});

test('inject time provision', () => {
  const space = new ServiceSpace(null, [
    Foo,
    { provide: HELLO, withValue: staticGreeter },
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazFactory },
  ]);
  space.bootstrap();

  const myFoo = { my: 'foo' };
  const myBar = { my: 'bar' };
  const myBaz = { my: 'baz' };
  const myGreeter = { hello: 'WORLD' };
  const injectTimeProvisions = new Map<any, any>([
    [Foo, myFoo],
    [Bar, myBar],
    [BAZ, myBaz],
    [HELLO, myGreeter],
  ]);

  const scope = space.createScope();
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
      makeContainer({ deps: [HELLO, Foo, Bar, BAZ] })((...args) => args),
      injectTimeProvisions
    )
  ).toEqual([greeter, foo, bar, baz]);

  expect(Foo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory.mock).not.toHaveBeenCalled();
  expect(bazFactory.$$factory.mock).not.toHaveBeenCalled();
});

test('boostrap time provision', () => {
  const BOOTSTRAP_TIME_INTERFACE = makeInterface({ name: 'BOO' });
  const BooConsumer = makeClassProvider({
    deps: [BOOTSTRAP_TIME_INTERFACE],
    lifetime: 'singleton',
  })(moxy(class BooConsumer {}));

  const space = new ServiceSpace(null, [
    Foo,
    { provide: HELLO, withValue: staticGreeter },
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazFactory },
    BooConsumer,
  ]);
  space.bootstrap(new Map([[BOOTSTRAP_TIME_INTERFACE, 'boooo~']]));

  expect(BooConsumer.mock).toHaveBeenCalledTimes(1);
  expect(BooConsumer.mock).toHaveBeenCalledWith('boooo~');

  expect(() =>
    space.createScope().useServices([BOOTSTRAP_TIME_INTERFACE])
  ).toThrowErrorMatchingInlineSnapshot(`"BOO is not bound"`);
});

test('require underlying ServiceScope', () => {
  const singletonService = makeClassProvider({
    deps: [ServiceScope],
    lifetime: 'singleton',
  })(moxy());
  const scopedService = makeClassProvider({
    deps: [ServiceScope],
    lifetime: 'scoped',
  })(moxy());

  const space = new ServiceSpace(null, [singletonService, scopedService]);
  const scope = space.bootstrap();

  expect(scope).toBeInstanceOf(ServiceScope);
  expect(singletonService.mock).toHaveBeenCalledTimes(1);
  expect(singletonService.mock.calls[0].args[0]).toBe(scope);

  const consumerContainer = moxy(
    makeContainer({ deps: [ServiceScope, scopedService] })(() => ({}))
  );

  scope.injectContainer(consumerContainer);

  expect(consumerContainer.mock).toHaveBeenCalledTimes(1);
  expect(consumerContainer.mock.calls[0].args[0]).toBe(scope);
  expect(scopedService.mock).toHaveBeenCalledTimes(1);
  expect(scopedService.mock.calls[0].args[0]).toBe(scope);

  const [requiredScope] = scope.useServices([ServiceScope]);
  expect(requiredScope).toBe(scope);
});
