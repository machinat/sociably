import moxy from '@moxyjs/moxy';
import {
  SOCIABLY_SERVICE_PROVIDER,
  SOCIABLY_SERVICE_INTERFACE,
} from '../../../symbol';
import serviceProviderClass from '../serviceProviderClass';

const FooServiceI = {
  $$typeof: SOCIABLY_SERVICE_PROVIDER,
  /* ... */
} as any;
const BarServiceI = {
  $$typeof: SOCIABLY_SERVICE_INTERFACE,
  /* ... */
} as any;
const BazServiceI = {
  $$typeof: SOCIABLY_SERVICE_INTERFACE,
  /* ... */
} as any;

describe('serviceProviderClass({ deps, factory, lifetime })(klass)', () => {
  it('annotate metadatas', () => {
    const ServiceKlazz = class ServiceKlazz {};
    const klazzFactory = () => new ServiceKlazz();

    const MyProvider = serviceProviderClass({
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
    expect(MyProvider.$$typeof).toBe(SOCIABLY_SERVICE_PROVIDER);
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

    const MyProvider = serviceProviderClass({
      deps: [FooServiceI, BarServiceI, BazServiceI],
    })(ServiceKlazz);

    expect(MyProvider.$$name).toBe('ServiceKlazz');
    expect(MyProvider.$$lifetime).toBe('singleton');
    expect(MyProvider.$$multi).toBe(false);

    expect(MyProvider.$$factory('foo', 'bar', 'baz')).toBeInstanceOf(
      ServiceKlazz
    );
    expect(ServiceKlazz).toHaveBeenCalledWith('foo', 'bar', 'baz');
  });

  it('throw if invalid deps received', () => {
    class NoneService {}

    expect(() => {
      serviceProviderClass({
        deps: [NoneService as any],
        lifetime: 'singleton',
      })(class MyProvider {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"NoneService is not a valid interface"`
    );
  });

  it('throw if invalid lifetime received', () => {
    expect(() =>
      serviceProviderClass({ lifetime: 'singleton' })(class K {})
    ).not.toThrow();
    expect(() =>
      serviceProviderClass({ lifetime: 'scoped' })(class K {})
    ).not.toThrow();
    expect(() =>
      serviceProviderClass({ lifetime: 'transient' })(class K {})
    ).not.toThrow();

    expect(() => {
      serviceProviderClass({ lifetime: 'elf' } as never)(class K {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"elf is not valid service lifetime"`
    );
  });
});
