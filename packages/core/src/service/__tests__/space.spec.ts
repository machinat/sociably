/* eslint-disable class-methods-use-this */
import moxy from '@moxyjs/moxy';
import ServiceSpace from '../space';
import ServiceScope from '../scope';
import serviceContainer from '../decorators/serviceContainer';
import serviceProviderFactory from '../decorators/serviceProviderFactory';
import serviceProviderClass from '../decorators/serviceProviderClass';
import serviceInterface from '../decorators/serviceInterface';

const HELLO = serviceInterface<{ hello(): string }>({ name: 'Hello' });
const staticGreeter = moxy({ hello: () => 'HI' });

const Foo = moxy(
  serviceProviderClass({ deps: [HELLO], lifetime: 'singleton' })(
    class Foo {
      foo() {
        return 'Foo';
      }
    }
  )
);

const Bar = serviceInterface<{ bar(): string }>({ name: 'BAR' });

const BarImpl = moxy(
  serviceProviderClass({ deps: [Foo], lifetime: 'scoped' })(
    class BarImpl {
      bar() {
        return 'BarImpl';
      }
    }
  )
);

const BAZ = serviceInterface<{ baz(): string }>({ name: 'Baz' });
const Baz = class Baz {
  baz() {
    return 'Baz';
  }
};
const bazProvider = moxy(
  serviceProviderFactory({ deps: [Foo, Bar], lifetime: 'transient' })(
    () => new Baz()
  )
);

const myContainer = moxy(
  serviceContainer({ deps: [HELLO, Foo, Bar, BAZ] })(
    (greeter, foo, bar, baz) =>
      `${greeter.hello()} ${foo.foo()} ${bar.bar()} ${baz.baz()}`
  )
);

beforeEach(() => {
  Foo.mock.reset();
  BarImpl.mock.reset();
  bazProvider.mock.reset();
  myContainer.mock.reset();
});

it('provide services bound in bindings', () => {
  const space = new ServiceSpace(null, [
    Foo,
    { provide: HELLO, withValue: staticGreeter },
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazProvider },
  ]);
  space.bootstrap();

  expect(Foo.$$factory).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory).not.toHaveBeenCalled();

  const scope = space.createScope();
  expect(scope).toBeInstanceOf(ServiceScope);

  expect(scope.injectContainer(myContainer)).toBe('HI Foo BarImpl Baz');

  const [greeter, foo, bar, baz] = scope.useServices([HELLO, Foo, Bar, BAZ]);
  expect(greeter).toBe(staticGreeter);
  expect(foo).toBeInstanceOf(Foo);
  expect(bar).toBeInstanceOf(BarImpl);
  expect(baz).toBeInstanceOf(Baz);

  expect(Foo.$$factory).toHaveBeenCalledTimes(1);
  expect(Foo.$$factory).toHaveBeenCalledWith(greeter);

  expect(BarImpl.$$factory).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory).toHaveBeenCalledWith(foo);

  expect(bazProvider.$$factory).toHaveBeenCalledTimes(2);
  expect(bazProvider.$$factory).toHaveBeenCalledWith(foo, bar);

  expect(myContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(myContainer.$$factory).toHaveBeenCalledWith(
    greeter,
    foo,
    bar,
    expect.any(Baz)
  );
});

test('new bindings are prioritized to the bindings from base space', () => {
  const MyFoo = moxy(
    serviceProviderClass({ deps: [Bar, BAZ], lifetime: 'singleton' })(
      class MyFoo {
        foo() {
          return 'MyFoo';
        }
      }
    )
  );
  const AnotherBar = moxy(
    serviceProviderClass({ deps: [BAZ], lifetime: 'singleton' })(
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
    { provide: BAZ, withProvider: bazProvider },
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

  expect(MyFoo.$$factory).toHaveBeenCalledTimes(1);
  expect(MyFoo.$$factory).toHaveBeenCalledWith(bar, baz);
  expect(Foo.$$factory).not.toHaveBeenCalled();

  expect(AnotherBar.$$factory).toHaveBeenCalledTimes(1);
  expect(AnotherBar.$$factory).toHaveBeenCalledWith(baz);
  expect(BarImpl.$$factory).not.toHaveBeenCalled();

  expect(bazProvider.$$factory).not.toHaveBeenCalled();

  expect(myContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(myContainer.$$factory).toHaveBeenCalledWith(
    staticGreeter,
    foo,
    bar,
    baz
  );
});

it('throw if bindings conflicted', () => {
  const someBar = { bar: () => '🍻' };
  expect(
    () =>
      new ServiceSpace(null, [
        Foo,
        { provide: BAZ, withValue: bazProvider },
        { provide: Bar, withProvider: BarImpl },
        { provide: Bar, withValue: someBar },
      ])
  ).toThrowErrorMatchingInlineSnapshot(`"BAR is already bound to BarImpl"`);

  expect(
    () =>
      new ServiceSpace(
        new ServiceSpace(null, [Foo, { provide: BAZ, withValue: bazProvider }]),
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
      [{ provide: BAZ, withProvider: bazProvider }]
    ).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(`"BAR is not bound"`);
});

it('throw if invalid binding received', () => {
  expect(
    () => new ServiceSpace(null, [Bar] as never)
  ).toThrowErrorMatchingInlineSnapshot(
    `"BAR is an interface and cannot be provided directly"`
  );
  expect(
    () =>
      new ServiceSpace(null, [
        { provide: class Bae {}, withValue: 'bae~' } as never,
      ])
  ).toThrowErrorMatchingInlineSnapshot(`"invalid service interface Bae"`);
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
  const SelfDependentFoo = serviceProviderClass({
    deps: [Foo],
    lifetime: 'scoped',
  })(class SelfDependentFoo {});

  expect(() =>
    new ServiceSpace(null, [
      { provide: Foo, withProvider: SelfDependentFoo },
    ]).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(
    `"SelfDependentFoo is circular dependent (SelfDependentFoo > SelfDependentFoo)"`
  );

  const CircularDependentFoo = serviceProviderClass({
    deps: [Bar],
    lifetime: 'scoped',
  })(class CircularDependentFoo {});
  expect(() =>
    new ServiceSpace(null, [
      { provide: Foo, withProvider: CircularDependentFoo },
      { provide: Bar, withProvider: BarImpl },
    ]).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(
    `"CircularDependentFoo is circular dependent (CircularDependentFoo > BarImpl > CircularDependentFoo)"`
  );
});

it('provide polymorphic interface with a map of platform and service', () => {
  const polymorphicMammal = serviceInterface({
    name: 'FooMammal',
    polymorphic: true,
  });

  const fooCat = { foo: () => 'FOO_MEOW' };
  const fooCatFactory = serviceProviderFactory({ lifetime: 'transient' })(
    () => fooCat
  );
  const fooBird = { foo: () => 'FOO_TWEET' };
  const fooWhale = { foo: () => 'FOO_SONAR' };

  const space = new ServiceSpace(null, [
    {
      provide: polymorphicMammal,
      platform: 'cat',
      withProvider: fooCatFactory,
    },
    { provide: polymorphicMammal, platform: 'bird', withValue: fooBird },
    { provide: polymorphicMammal, platform: 'whale', withValue: fooWhale },
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

  expect(scope.useServices([polymorphicMammal])).toEqual([expectedMap]);

  const mammalContainer = serviceContainer({ deps: [polymorphicMammal] })(
    (mammals) => mammals
  );
  expect(scope.injectContainer(mammalContainer)).toEqual(expectedMap);
});

it('throw if bindings conflicted on specified platform', () => {
  const polymorphicMammal = serviceInterface({
    name: 'FooMammal',
    polymorphic: true,
  });

  const whiteCat = { foo: () => 'FOO_MEOW' };
  const whiteCatFactory = serviceProviderFactory({ lifetime: 'transient' })(
    () => whiteCat
  );
  const blackCat = { foo: () => 'FOO_MEOW' };
  expect(() =>
    new ServiceSpace(null, [
      {
        provide: polymorphicMammal,
        platform: 'cat',
        withProvider: whiteCatFactory,
      },
      { provide: polymorphicMammal, platform: 'cat', withValue: blackCat },
    ]).bootstrap()
  ).toThrowErrorMatchingInlineSnapshot(
    `"FooMammal is already bound to () => whiteCat on 'cat' platform"`
  );
});

it('registered polymorphic bindings overrides the base one on platform', () => {
  const polymorphicMammal = serviceInterface({
    name: 'FooMammal',
    polymorphic: true,
  });

  const whiteCat = { foo: () => 'FOO_MEOW' };
  const blackCat = { foo: () => 'FOO_MEOW' };
  const space = new ServiceSpace(
    new ServiceSpace(null, [
      { provide: polymorphicMammal, platform: 'cat', withValue: whiteCat },
    ]),
    [{ provide: polymorphicMammal, platform: 'cat', withValue: blackCat }]
  );
  space.bootstrap();

  const scope = space.createScope();
  expect(scope.useServices([polymorphicMammal])).toEqual([
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

  const fooContainer = serviceContainer({ deps: [Foo, Bar, BAZ] })(
    () => 'BOOM'
  );

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

  const optionalDepsContainer = serviceContainer({
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
  const MusicalBar = serviceInterface({ name: 'MusicalBar' });
  const JazzBar = serviceInterface({ name: 'JazzBar' });

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

  expect(BarImpl.$$factory).toHaveBeenCalledTimes(1);
});

test('lifecycle of services of different lifetime', () => {
  const space = new ServiceSpace(null, [
    Foo,
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazProvider },
    { provide: HELLO, withValue: staticGreeter },
  ]);
  space.bootstrap();

  expect(Foo.$$factory).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory).not.toHaveBeenCalled();
  expect(bazProvider.$$factory).not.toHaveBeenCalled();

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

  expect(Foo.$$factory).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory).toHaveBeenCalledTimes(2);
  expect(bazProvider.$$factory).toHaveBeenCalledTimes(3);
});

test('provide multi interface as an array of bound value', () => {
  const MULTI_FOOD = serviceInterface({ name: 'MultiFood', multi: true });
  const bistroFactory = moxy(
    serviceProviderFactory({
      lifetime: 'singleton',
      deps: [MULTI_FOOD],
    })((dishes) => ({
      serve: () => dishes,
    }))
  );

  const meatFactory = moxy(
    serviceProviderFactory({ lifetime: 'scoped' })(() => '🥩')
  );

  const burgerFactory = moxy(
    serviceProviderFactory({
      lifetime: 'singleton',
      deps: [meatFactory],
    })(() => '🍔')
  );
  const hotdogFactory = moxy(
    serviceProviderFactory({
      lifetime: 'scoped',
      deps: [meatFactory],
    })(() => '🌭')
  );

  const pizzaFactory = moxy(
    serviceProviderFactory({ lifetime: 'singleton' })(() => '🍕')
  );
  const tacoFactory = moxy(
    serviceProviderFactory({ lifetime: 'scoped' })(() => '🌮')
  );
  const ramenFactory = moxy(
    serviceProviderFactory({ lifetime: 'transient' })(() => '🍜')
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

  expect(meatFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(bistroFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(bistroFactory.$$factory).toHaveBeenLastCalledWith([
    '🍔',
    '🍕',
    '🌮',
    '🍝',
    '🍕',
    '🌭',
    '🍜',
    '🥙',
  ]);

  expect(burgerFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(burgerFactory.$$factory).toHaveBeenCalledWith('🥩');

  expect(hotdogFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(hotdogFactory.$$factory).toHaveBeenCalledWith('🥩');

  expect(tacoFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(pizzaFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(ramenFactory.$$factory).toHaveBeenCalledTimes(1);

  const scope = space.createScope();
  expect(scope.useServices([MULTI_FOOD])).toEqual([
    ['🍔', '🍕', '🌮', '🍝', '🍕', '🌭', '🍜', '🥙'],
  ]);

  expect(burgerFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(pizzaFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(hotdogFactory.$$factory).toHaveBeenCalledTimes(2);
  expect(tacoFactory.$$factory).toHaveBeenCalledTimes(2);
  expect(ramenFactory.$$factory).toHaveBeenCalledTimes(2);
});

test('provide multi interface as an empty array if no value bound', () => {
  const MULTI_FOO = serviceInterface({ name: 'MultiFoo', multi: true });
  const needFooFactory = moxy(
    serviceProviderFactory({
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

  expect(needFooFactory.$$factory).toHaveBeenCalledTimes(1);
  expect(needFooFactory.$$factory).toHaveBeenCalledWith([]);

  const scope = space.createScope();
  expect(scope.useServices([MULTI_FOO])).toEqual([[]]);
});

test('inject time provision', () => {
  const space = new ServiceSpace(null, [
    Foo,
    { provide: HELLO, withValue: staticGreeter },
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazProvider },
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
      serviceContainer({ deps: [HELLO, Foo, Bar, BAZ] })((...args) => args),
      injectTimeProvisions
    )
  ).toEqual([greeter, foo, bar, baz]);

  expect(Foo.$$factory).toHaveBeenCalledTimes(1);
  expect(BarImpl.$$factory).not.toHaveBeenCalled();
  expect(bazProvider.$$factory).not.toHaveBeenCalled();
});

test('boostrap time provision', () => {
  const BOOTSTRAP_TIME_INTERFACE = serviceInterface({ name: 'BOO' });
  const BooConsumer = serviceProviderClass({
    deps: [BOOTSTRAP_TIME_INTERFACE],
    lifetime: 'singleton',
  })(moxy(class BooConsumer {}));

  const space = new ServiceSpace(null, [
    Foo,
    { provide: HELLO, withValue: staticGreeter },
    { provide: Bar, withProvider: BarImpl },
    { provide: BAZ, withProvider: bazProvider },
    BooConsumer,
  ]);
  space.bootstrap(new Map([[BOOTSTRAP_TIME_INTERFACE, 'boooo~']]));

  expect(BooConsumer).toHaveBeenCalledTimes(1);
  expect(BooConsumer).toHaveBeenCalledWith('boooo~');

  expect(() =>
    space.createScope().useServices([BOOTSTRAP_TIME_INTERFACE])
  ).toThrowErrorMatchingInlineSnapshot(`"BOO is not bound"`);
});

test('require underlying ServiceScope', () => {
  const singletonService = moxy(
    serviceProviderClass({
      deps: [ServiceScope],
      lifetime: 'singleton',
    })(class A {})
  );

  const scopedService = moxy(
    serviceProviderClass({
      deps: [ServiceScope],
      lifetime: 'scoped',
    })(class B {})
  );

  const space = new ServiceSpace(null, [singletonService, scopedService]);
  const scope = space.bootstrap();

  expect(scope).toBeInstanceOf(ServiceScope);
  expect(singletonService.$$factory).toHaveBeenCalledTimes(1);
  expect(singletonService.$$factory.mock.calls[0].args[0]).toBe(scope);

  const consumerContainer = moxy(
    serviceContainer({ deps: [ServiceScope, scopedService] })(() => ({}))
  );

  scope.injectContainer(consumerContainer);

  expect(consumerContainer.$$factory).toHaveBeenCalledTimes(1);
  expect(consumerContainer.$$factory.mock.calls[0].args[0]).toBe(scope);
  expect(scopedService.$$factory).toHaveBeenCalledTimes(1);
  expect(scopedService.$$factory.mock.calls[0].args[0]).toBe(scope);

  const [requiredScope] = scope.useServices([ServiceScope]);
  expect(requiredScope).toBe(scope);
});
