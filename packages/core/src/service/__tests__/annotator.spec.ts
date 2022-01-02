import moxy from '@moxyjs/moxy';
import {
  MACHINAT_SERVICE_PROVIDER,
  MACHINAT_SERVICE_CONTAINER,
  MACHINAT_SERVICE_INTERFACE,
} from '../../symbol';
import {
  makeContainer,
  makeClassProvider,
  makeFactoryProvider,
  makeInterface,
} from '../annotator';

const FooServiceI = {
  $$typeof: MACHINAT_SERVICE_PROVIDER,
  /* ... */
};
const BarServiceI = {
  $$typeof: MACHINAT_SERVICE_INTERFACE,
  /* ... */
};
const BazServiceI = {
  $$typeof: MACHINAT_SERVICE_INTERFACE,
  /* ... */
};

describe('makeContainer({ deps })(fn)', () => {
  it('annotate deps of container', () => {
    const containerFn = () => {};

    const myContainer = makeContainer({
      name: 'myContainer',
      deps: [
        FooServiceI,
        { require: BarServiceI, optional: false },
        { require: BazServiceI, optional: true },
      ],
    })(containerFn);

    expect(myContainer).toBe(containerFn);
    expect(myContainer.$$typeof).toBe(MACHINAT_SERVICE_CONTAINER);
    expect(myContainer.$$name).toBe('myContainer');
    expect(myContainer.$$deps).toEqual([
      { require: FooServiceI, optional: false },
      { require: BarServiceI, optional: false },
      { require: BazServiceI, optional: true },
    ]);
  });

  test('default $$name and $$deps', () => {
    const containerFn = () => {};
    const myContainer = makeContainer({})(containerFn);

    expect(myContainer).toBe(containerFn);
    expect(myContainer.$$typeof).toBe(MACHINAT_SERVICE_CONTAINER);
    expect(myContainer.$$name).toBe('containerFn');
    expect(myContainer.$$deps).toEqual([]);
  });

  it('throw if invalid deps received', () => {
    class NonService {}

    expect(() => {
      makeContainer({ deps: [NonService] })((_whatever) => 'boom');
    }).toThrowErrorMatchingInlineSnapshot(
      `"NonService is not a valid interface"`
    );
  });
});

describe('makeClassProvider({ deps, factory, lifetime })(klass)', () => {
  it('annotate metadatas', () => {
    const ServiceKlazz = class ServiceKlazz {};
    const klazzFactory = () => new ServiceKlazz();

    const MyProvider = makeClassProvider({
      name: 'MyProvider',
      factory: klazzFactory,
      deps: [
        FooServiceI,
        { require: BarServiceI, optional: false },
        { require: BazServiceI, optional: true },
      ],
      lifetime: 'scoped',
    })(ServiceKlazz);

    expect(MyProvider).toBe(ServiceKlazz);
    expect(MyProvider.$$typeof).toBe(MACHINAT_SERVICE_PROVIDER);
    expect(MyProvider.$$name).toBe('MyProvider');
    expect(MyProvider.$$deps).toEqual([
      { require: FooServiceI, optional: false },
      { require: BarServiceI, optional: false },
      { require: BazServiceI, optional: true },
    ]);
    expect(MyProvider.$$factory).toBe(klazzFactory);
    expect(MyProvider.$$lifetime).toBe('scoped');
    expect(MyProvider.$$multi).toBe(false);
  });

  test('default properties', () => {
    const ServiceKlazz = moxy(class ServiceKlazz {}, { mockMethod: false });

    const MyProvider = makeClassProvider()(ServiceKlazz);

    expect(MyProvider.$$name).toBe('ServiceKlazz');
    expect(MyProvider.$$lifetime).toBe('singleton');
    expect(MyProvider.$$deps).toEqual([]);
    expect(MyProvider.$$multi).toBe(false);

    expect(MyProvider.$$factory('foo', 'bar', 'baz')).toBeInstanceOf(
      ServiceKlazz
    );
    expect(ServiceKlazz.mock).toHaveBeenCalledWith('foo', 'bar', 'baz');
  });

  it('throw if invalid deps received', () => {
    class NonService {}

    expect(() => {
      makeClassProvider({
        deps: [NonService],
        lifetime: 'singleton',
      })(class MyProvider {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"NonService is not a valid interface"`
    );
  });

  it('throw if invalid lifetime received', () => {
    expect(() =>
      makeClassProvider({ lifetime: 'singleton' })(class K {})
    ).not.toThrow();
    expect(() =>
      makeClassProvider({ lifetime: 'scoped' })(class K {})
    ).not.toThrow();
    expect(() =>
      makeClassProvider({ lifetime: 'transient' })(class K {})
    ).not.toThrow();

    expect(() => {
      makeClassProvider({ lifetime: 'elf' } as never)(class K {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"elf is not valid service lifetime"`
    );
  });
});

describe('makeFactoryProvider({ deps, lifetime })(factory)', () => {
  it('annotate metadatas', () => {
    const factoryFn = (foo, bar, baz) => ({ foo, bar, baz });

    const providerFactory = makeFactoryProvider({
      name: 'myFactory',
      deps: [
        FooServiceI,
        { require: BarServiceI, optional: false },
        { require: BazServiceI, optional: true },
      ],
      lifetime: 'transient',
    })(factoryFn);

    expect(providerFactory).toBe(factoryFn);
    expect(providerFactory.$$typeof).toBe(MACHINAT_SERVICE_PROVIDER);
    expect(providerFactory.$$name).toBe('myFactory');
    expect(providerFactory.$$deps).toEqual([
      { require: FooServiceI, optional: false },
      { require: BarServiceI, optional: false },
      { require: BazServiceI, optional: true },
    ]);
    expect(providerFactory.$$factory).toBe(factoryFn);
    expect(providerFactory.$$lifetime).toBe('transient');
  });

  test('default properties', () => {
    const factoryFn = (foo, bar, baz) => ({ foo, bar, baz });

    const providerFactory = makeFactoryProvider()(factoryFn);

    expect(providerFactory.$$lifetime).toBe('transient');
    expect(providerFactory.$$name).toBe('factoryFn');
    expect(providerFactory.$$deps).toEqual([]);
  });

  it('throw if invalid deps received', () => {
    class NonService {}

    expect(() => {
      makeFactoryProvider({
        deps: [NonService],
        lifetime: 'scoped',
      })((foo) => ({ foo }));
    }).toThrowErrorMatchingInlineSnapshot(
      `"NonService is not a valid interface"`
    );
  });

  it('throw if invalid lifetime received', () => {
    expect(() =>
      makeFactoryProvider({ lifetime: 'singleton' })(() => 'foo')
    ).not.toThrow();
    expect(() =>
      makeFactoryProvider({ lifetime: 'scoped' })(() => 'foo')
    ).not.toThrow();
    expect(() =>
      makeFactoryProvider({ lifetime: 'transient' })(() => 'foo')
    ).not.toThrow();

    expect(() => {
      makeFactoryProvider({ lifetime: 'halfling' } as never)(() => 'foo');
    }).toThrowErrorMatchingInlineSnapshot(
      `"halfling is not valid service lifetime"`
    );
  });
});

describe('makeInterface(name)', () => {
  it('create annotation object', () => {
    const MyFooInterface = makeInterface({ name: 'Foo' });

    expect(MyFooInterface.$$typeof).toBe(MACHINAT_SERVICE_INTERFACE);
    expect(MyFooInterface.$$name).toBe('Foo');
    expect(MyFooInterface.$$multi).toBe(false);

    const MyBarsInterface = makeInterface({ name: 'Bars', multi: true });

    expect(MyBarsInterface.$$typeof).toBe(MACHINAT_SERVICE_INTERFACE);
    expect(MyBarsInterface.$$name).toBe('Bars');
    expect(MyBarsInterface.$$multi).toBe(true);
  });
});
