import moxy from '@moxyjs/moxy';
import {
  MACHINAT_SERVICE_PROVIDER,
  MACHINAT_SERVICE_CONTAINER,
  MACHINAT_SERVICE_INTERFACE,
} from '../../symbol';
import {
  container,
  provider,
  factory,
  abstractInterface,
  makeInterface,
} from '../annotate';

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

describe('container({ deps })(fn)', () => {
  it('annotate deps of container', () => {
    const containerFn = () => {};

    const myContainer = container({
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
    const myContainer = container()(containerFn);

    expect(myContainer).toBe(containerFn);
    expect(myContainer.$$typeof).toBe(MACHINAT_SERVICE_CONTAINER);
    expect(myContainer.$$name).toBe('containerFn');
    expect(myContainer.$$deps).toEqual([]);
  });

  it('throw if invalid deps received', () => {
    class NonService {}

    expect(() => {
      container({ deps: [NonService] })((_whatever) => 'boom');
    }).toThrowErrorMatchingInlineSnapshot(
      `"NonService is not a valid interface"`
    );
  });
});

describe('provider({ deps, factory, lifetime })(klass)', () => {
  it('annotate metadatas', () => {
    class ServiceKlazz {}
    const klazzFactory = (foo, bar, baz) => new ServiceKlazz(foo, bar, baz);

    const MyProvider = provider({
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

  test('default $$factory, $$name and $$deps', () => {
    const ServiceKlazz = moxy(class ServiceKlazz {}, { mockMethod: false });

    const MyProvider = provider({ lifetime: 'singleton' })(ServiceKlazz);

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
      provider({
        deps: [NonService],
        factory: (_whatever) => 'boom',
        lifetime: 'singleton',
      })(class MyProvider {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"NonService is not a valid interface"`
    );
  });

  it('throw if invalid lifetime received', () => {
    expect(() => provider({ lifetime: 'singleton' })(class K {})).not.toThrow();
    expect(() => provider({ lifetime: 'scoped' })(class K {})).not.toThrow();
    expect(() => provider({ lifetime: 'transient' })(class K {})).not.toThrow();

    expect(() => {
      provider({ lifetime: 'elf' })(class K {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"elf is not valid service lifetime"`
    );
  });
});

describe('factory({ deps, lifetime })(factory)', () => {
  it('annotate metadatas', () => {
    const factoryFn = (foo, bar, baz) => ({ foo, bar, baz });

    const providerFactory = factory({
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

  test('default $$name and $$deps', () => {
    const factoryFn = (foo, bar, baz) => ({ foo, bar, baz });

    const providerFactory = factory({ lifetime: 'scoped' })(factoryFn);

    expect(providerFactory.$$name).toBe('factoryFn');
    expect(providerFactory.$$deps).toEqual([]);
  });

  it('throw if invalid deps received', () => {
    class NonService {}

    expect(() => {
      provider({ deps: [NonService], lifetime: 'scoped' })((foo) => ({ foo }));
    }).toThrowErrorMatchingInlineSnapshot(
      `"NonService is not a valid interface"`
    );
  });

  it('throw if invalid lifetime received', () => {
    expect(() => factory({ lifetime: 'singleton' })(() => 'foo')).not.toThrow();
    expect(() => factory({ lifetime: 'scoped' })(() => 'foo')).not.toThrow();
    expect(() => factory({ lifetime: 'transient' })(() => 'foo')).not.toThrow();

    expect(() => {
      factory({ lifetime: 'halfling' })(() => 'foo');
    }).toThrowErrorMatchingInlineSnapshot(
      `"halfling is not valid service lifetime"`
    );
  });
});

describe('abstractInterface(options)(klass)', () => {
  it('annotate $$typeof as class', () => {
    class AbstractKlazz {}
    const AbstractInterface = abstractInterface({
      name: 'AbstractInterface',
    })(AbstractKlazz);

    expect(AbstractInterface).toBe(AbstractKlazz);
    expect(AbstractInterface.$$typeof).toBe(MACHINAT_SERVICE_INTERFACE);
    expect(AbstractInterface.$$name).toBe('AbstractInterface');
  });

  test('default $$name', () => {
    class AbstractKlazz {}
    const AbstractInterface = abstractInterface()(AbstractKlazz);

    expect(AbstractInterface.$$name).toBe('AbstractKlazz');
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
