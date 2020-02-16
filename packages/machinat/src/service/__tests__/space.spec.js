/* eslint-disable class-methods-use-this */
import { factory as moxyFactory } from 'moxy';
import ServiceSpace from '../space';
import Scope from '../scope';
import { inject, provider, namedInterface, abstract } from '../annotate';

const moxy = moxyFactory({ excludeProps: ['$$deps'] });

const Foo = namedInterface('Foo');
const staticFoo = moxy({ foo: () => 'FOO' });

const Bar = moxy(
  provider({
    deps: [Foo],
    factory: () => new Bar(),
    strategy: 'singleton',
  })(
    class Bar {
      bar() {
        return 'Bar';
      }
    }
  )
);

const Baz = abstract()(
  class BazAbstract {
    baz() {
      throw new Error('too abstract');
    }
  }
);

const BazImpl = moxy(
  provider({
    deps: [Foo, Bar],
    factory: () => new BazImpl(),
    strategy: 'scoped',
  })(
    class BazImpl {
      baz() {
        return 'BazImpl';
      }
    }
  )
);

const container = moxy(
  inject({
    deps: [Foo, Bar, Baz],
  })((foo, bar, baz) => `${foo.foo()} ${bar.bar()} ${baz.baz()}`)
);

beforeEach(() => {
  staticFoo.mock.reset();
  Bar.$$factory.mock.reset();
  BazImpl.$$factory.mock.reset();
  container.mock.reset();
});

it('provide services bound in bindings', () => {
  const space = new ServiceSpace(
    [{ provide: Baz, withProvider: BazImpl }],
    [{ provide: Foo, withValue: staticFoo }, Bar]
  );

  const scope = space.createScope('test');
  expect(scope).toBeInstanceOf(Scope);

  expect(scope.injectContainer(container)).toBe('FOO Bar BazImpl');

  const [foo, bar, baz] = scope.useServices([Foo, Bar, Baz]);
  expect(foo).toBe(staticFoo);
  expect(bar).toBeInstanceOf(Bar);
  expect(baz).toBeInstanceOf(BazImpl);

  expect(Bar.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(Bar.$$factory.mock).toHaveBeenCalledWith(foo);

  expect(BazImpl.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BazImpl.$$factory.mock).toHaveBeenCalledWith(foo, bar);

  expect(container.mock).toHaveBeenCalledTimes(1);
  expect(container.mock).toHaveBeenCalledWith(foo, bar, baz);
});

test('registered bindings prioritized to modules bindings', () => {
  const MyFoo = moxy(
    provider({
      deps: [Bar, Baz],
      factory: () => new MyFoo(),
      strategy: 'singleton',
    })(
      class MyFoo {
        foo() {
          return 'MyFoo';
        }
      }
    )
  );
  const AnotherBar = moxy(
    provider({
      deps: [Baz],
      factory: () => new AnotherBar(),
      strategy: 'singleton',
    })(
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
      { provide: Foo, withValue: staticFoo },
      Bar,
      { provide: Baz, withProvider: BazImpl },
    ],
    [
      { provide: Foo, withProvider: MyFoo },
      { provide: Bar, withProvider: AnotherBar },
      { provide: Baz, withValue: fakeBaz },
    ]
  );

  const scope = space.createScope('test');
  expect(scope.injectContainer(container)).toBe('MyFoo AnotherBar NO_BAZ');

  const [foo, bar, baz] = scope.useServices([Foo, Bar, Baz]);
  expect(foo).toBeInstanceOf(MyFoo);
  expect(bar).toBeInstanceOf(AnotherBar);
  expect(baz).toBe(fakeBaz);

  expect(MyFoo.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(MyFoo.$$factory.mock).toHaveBeenCalledWith(bar, baz);
  expect(staticFoo.foo.mock).not.toHaveBeenCalled();

  expect(AnotherBar.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(AnotherBar.$$factory.mock).toHaveBeenCalledWith(baz);
  expect(Bar.$$factory.mock).not.toHaveBeenCalled();

  expect(BazImpl.$$factory.mock).not.toHaveBeenCalled();

  expect(container.mock).toHaveBeenCalledTimes(1);
  expect(container.mock).toHaveBeenCalledWith(foo, bar, baz);
});

it('throw if bindings conflicted', () => {
  const someBaz = { baz: () => 'zzz' };
  expect(
    () =>
      new ServiceSpace(
        [
          { provide: Baz, withProvider: BazImpl },
          { provide: Baz, withValue: someBaz },
        ],
        [{ provide: Foo, withValue: staticFoo }, Bar]
      )
  ).toThrowErrorMatchingInlineSnapshot(
    `"BazAbstract is already bound on default branch"`
  );

  const someBar = { bar: () => 'rrr' };
  expect(
    () =>
      new ServiceSpace(
        [{ provide: Baz, withProvider: BazImpl }],
        [
          { provide: Foo, withValue: staticFoo },
          { provide: Bar, withValue: someBar },
          Bar,
        ]
      )
  ).toThrowErrorMatchingInlineSnapshot(
    `"Bar is already bound on default branch"`
  );
});

it('throw if provider dependencies not bound', () => {
  expect(() => new ServiceSpace([], [Bar])).toThrowErrorMatchingInlineSnapshot(
    `"Foo is not bound"`
  );
  expect(
    () =>
      new ServiceSpace(
        [{ provide: Foo, withValue: staticFoo }],
        [{ provide: Baz, platforms: ['A', 'B'], withProvider: BazImpl }]
      )
  ).toThrowErrorMatchingInlineSnapshot(`"Bar is not bound"`);
});

it('throw circular dependent provider found', () => {
  const SelfDependentFoo = provider({
    deps: [Foo],
    facotry: () => {},
    strategy: 'scoped',
  })(class SelfDependentFoo {});
  expect(
    () =>
      new ServiceSpace([], [{ provide: Foo, withProvider: SelfDependentFoo }])
  ).toThrowErrorMatchingInlineSnapshot(
    `"SelfDependentFoo is circular dependent"`
  );

  const CircularDependentFoo = provider({
    deps: [Bar],
    facotry: () => {},
    strategy: 'scoped',
  })(class CircularDependentFoo {});
  expect(
    () =>
      new ServiceSpace(
        [{ provide: Foo, withProvider: CircularDependentFoo }],
        [Bar]
      )
  ).toThrowErrorMatchingInlineSnapshot(
    `"CircularDependentFoo is circular dependent"`
  );
});

it('provide service bound on specified platform within corresponded scope', () => {
  const space = new ServiceSpace(
    [{ provide: Foo, withValue: staticFoo }, Bar],
    [{ provide: Baz, platforms: ['A', 'B'], withProvider: BazImpl }]
  );

  const bazContainer = inject({ deps: [Baz] })(baz => baz.baz());

  const scopeA = space.createScope('A');
  expect(scopeA.injectContainer(bazContainer)).toBe('BazImpl');
  let [baz] = scopeA.useServices([Baz]);
  expect(baz).toBeInstanceOf(BazImpl);

  const scopeB = space.createScope('B');
  expect(scopeA.injectContainer(bazContainer)).toBe('BazImpl');
  [baz] = scopeB.useServices([Baz]);
  expect(baz).toBeInstanceOf(BazImpl);

  const scopeC = space.createScope('C');
  expect(() =>
    scopeC.injectContainer(bazContainer)
  ).toThrowErrorMatchingInlineSnapshot(`"BazAbstract is not bound"`);
  expect(() => scopeC.useServices([Baz])).toThrowErrorMatchingInlineSnapshot(
    `"BazAbstract is not bound"`
  );
});

it('provide service bound on specified platform prior to default one', () => {
  const fooCat = { foo: () => 'FOO_MEOW' };
  const fooBird = { foo: () => 'FOO_TWEET' };
  const fooWhale = { foo: () => 'FOO_SONAR' };

  const space = new ServiceSpace(
    [Bar, { provide: Baz, withProvider: BazImpl }],
    [
      { provide: Foo, withValue: fooCat },
      { provide: Foo, platforms: ['sky', 'on_the_tree'], withValue: fooBird },
      { provide: Foo, platforms: ['under_water'], withValue: fooWhale },
    ]
  );

  const fooContainer = inject({ deps: [Foo] })(foo => foo.foo());

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

it('throw if bindings conflicted on specified platform', () => {
  const someBaz = { baz: () => 'zzz' };
  expect(
    () =>
      new ServiceSpace(
        [
          { provide: Baz, platforms: ['a', 'b'], withProvider: BazImpl },
          { provide: Baz, platforms: ['b', 'c'], withValue: someBaz },
        ],
        [{ provide: Foo, withValue: staticFoo }, Bar]
      )
  ).toThrowErrorMatchingInlineSnapshot(
    `"BazAbstract is already bound on platform \\"b\\" branch"`
  );

  const someBar = { bar: () => 'rrr' };
  expect(
    () =>
      new ServiceSpace(
        [{ provide: Baz, withProvider: BazImpl }],
        [
          { provide: Foo, withValue: staticFoo },
          { provide: Bar, platforms: ['a', 'b'], withValue: someBar },
          { provide: Bar, platforms: ['b', 'c'], withProvider: Bar },
        ]
      )
  ).toThrowErrorMatchingInlineSnapshot(
    `"Bar is already bound on platform \\"b\\" branch"`
  );
});

it('throw if unbound service usage required', () => {
  const space = new ServiceSpace(
    [{ provide: Foo, withValue: staticFoo }],
    [Bar]
  );

  const fooContainer = inject({ deps: [Foo, Bar, Baz] })(() => 'BOOM');

  const scope = space.createScope('test');
  expect(() =>
    scope.injectContainer(fooContainer)
  ).toThrowErrorMatchingInlineSnapshot(`"BazAbstract is not bound"`);

  expect(() =>
    scope.useServices([Foo, Bar, Baz])
  ).toThrowErrorMatchingInlineSnapshot(`"BazAbstract is not bound"`);
});

test('optional dependency', () => {
  const space = new ServiceSpace(
    [Bar],
    [{ provide: Foo, withValue: staticFoo }]
  );

  const optionalDepsContainer = inject({
    deps: [
      Foo,
      { require: Bar, optional: true },
      { require: Baz, optional: true },
    ],
  })(
    (foo, bar, baz) =>
      `${foo.foo()} ${bar ? bar.bar() : 'x'} ${baz ? baz.baz() : 'x'}`
  );

  const scope = space.createScope('test');
  expect(scope.injectContainer(optionalDepsContainer)).toBe('FOO Bar x');

  const [foo, bar, baz] = scope.useServices([
    Foo,
    { require: Bar, optional: true },
    { require: Baz, optional: true },
  ]);
  expect(foo).toBe(staticFoo);
  expect(bar).toBeInstanceOf(Bar);
  expect(baz).toBe(null);
});

it('use the same instance of the same provider on different interface', () => {
  const MusicalBar = namedInterface('MusicalBar');
  const JazzBar = namedInterface('JazzBar');

  const space = new ServiceSpace(
    [{ provide: Foo, withValue: staticFoo }],
    [
      Bar,
      { provide: JazzBar, withProvider: Bar },
      { provide: MusicalBar, withProvider: Bar },
    ]
  );

  const scope = space.createScope('test');
  const [bar, jazzBar, musicalBar] = scope.useServices([
    Bar,
    JazzBar,
    MusicalBar,
  ]);

  expect(bar).toBeInstanceOf(Bar);
  expect(jazzBar).toBe(bar);
  expect(musicalBar).toBe(bar);

  expect(Bar.$$factory.mock).toHaveBeenCalledTimes(1);
});

test('lifecycle of services of different strategies', () => {
  const Fleeting = moxy(
    provider({
      deps: [Foo, Bar, Baz],
      factory: () => new Fleeting(),
      strategy: 'transient',
    })(class Fleeting {})
  );

  const space = new ServiceSpace(
    [{ provide: Foo, withValue: staticFoo }, Bar],
    [{ provide: Baz, withProvider: BazImpl }, Fleeting]
  );

  const services = [Foo, Bar, Baz, Fleeting];

  const scope1 = space.createScope('test');
  const [foo1, bar1, baz1, fleeting1] = scope1.useServices(services);
  expect(foo1).toBe(staticFoo);
  expect(bar1).toBeInstanceOf(Bar);
  expect(baz1).toBeInstanceOf(BazImpl);
  expect(fleeting1).toBeInstanceOf(Fleeting);

  const [foo2, bar2, baz2, fleeting2] = scope1.useServices(services);
  expect(foo2).toBe(foo1);
  expect(bar2).toBe(bar1);
  expect(baz2).toBe(baz1);
  expect(fleeting2).not.toBe(fleeting1);

  const scope2 = space.createScope('test');
  const [foo3, bar3, baz3, fleeting3] = scope2.useServices(services);

  expect(foo3).toBe(foo1);
  expect(bar3).toBe(bar1);
  expect(baz3).not.toBe(baz1);
  expect(baz3).toBeInstanceOf(BazImpl);
  expect(fleeting3).not.toBe(fleeting1);
  expect(fleeting3).not.toBe(fleeting2);

  expect(Bar.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BazImpl.$$factory.mock).toHaveBeenCalledTimes(2);
  expect(Fleeting.$$factory.mock).toHaveBeenCalledTimes(3);
});

test('inject time provision', () => {
  const Fleeting = moxy(
    provider({
      deps: [Foo, Bar, Baz],
      factory: () => new Fleeting(),
      strategy: 'transient',
    })(class Fleeting {})
  );

  const space = new ServiceSpace(
    [{ provide: Foo, withValue: staticFoo }, Bar],
    [{ provide: Baz, withProvider: BazImpl }, Fleeting]
  );

  const myFoo = { my: 'foo' };
  const myBar = { my: 'bar' };
  const myBaz = { my: 'baz' };
  const blaBlaBla = { bla: 'bla_bla' };
  const injectTimeProvisions = new Map([
    [Foo, myFoo],
    [Bar, myBar],
    [Baz, myBaz],
    [Fleeting, blaBlaBla],
  ]);

  const scope = space.createScope('test');
  const [foo, bar, baz, fleeting] = scope.useServices(
    [Foo, Bar, Baz, Fleeting],
    injectTimeProvisions
  );

  expect(foo).toBe(myFoo);
  expect(bar).toBe(myBar);
  expect(baz).toBe(myBaz);
  expect(fleeting).toBe(blaBlaBla);

  expect(
    scope.injectContainer(
      inject({ deps: [Foo, Bar, Baz, Fleeting] })((...args) => args),
      injectTimeProvisions
    )
  ).toEqual([foo, bar, baz, fleeting]);

  expect(Bar.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(BazImpl.$$factory.mock).toHaveBeenCalledTimes(1);
  expect(Fleeting.$$factory.mock).not.toHaveBeenCalled();
});
