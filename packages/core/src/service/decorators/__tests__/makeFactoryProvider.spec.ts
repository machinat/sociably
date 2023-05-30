import { moxy } from '@moxyjs/moxy';
import {
  SOCIABLY_SERVICE_PROVIDER,
  SOCIABLY_SERVICE_INTERFACE,
} from '../../../symbol.js';
import serviceProviderFactory from '../serviceProviderFactory.js';

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

describe('serviceProviderFactory({ deps, lifetime })(factory)', () => {
  it('annotate metadatas', () => {
    const factoryFn = moxy(function factoryFn(foo, bar, baz) {
      return { foo, bar, baz };
    });

    const factoryProvider = serviceProviderFactory({
      name: 'myFactory',
      deps: [
        FooServiceI,
        { require: BarServiceI, optional: false },
        { require: BazServiceI, optional: true },
      ],
      lifetime: 'transient',
    })(factoryFn);

    expect(factoryProvider).toBe(factoryFn);
    expect(factoryProvider.$$typeof).toBe(SOCIABLY_SERVICE_PROVIDER);
    expect(factoryProvider.$$name).toBe('myFactory');
    expect(factoryProvider.$$deps).toEqual([
      { require: FooServiceI, optional: false },
      { require: BarServiceI, optional: false },
      { require: BazServiceI, optional: true },
    ]);
    expect(factoryProvider.$$factory).toBe(factoryFn);
    expect(factoryProvider.$$lifetime).toBe('transient');

    expect(factoryProvider(0, 1, 2)).toEqual({ foo: 0, bar: 1, baz: 2 });
    expect(factoryFn).toHaveBeenCalledTimes(1);
    expect(factoryFn).toHaveBeenCalledWith(0, 1, 2);
  });

  test('default properties', () => {
    const providerFactory = serviceProviderFactory({})(function factoryFn() {});

    expect(providerFactory.$$lifetime).toBe('transient');
    expect(providerFactory.$$name).toBe('factoryFn');
    expect(providerFactory.$$deps).toEqual([]);
  });

  it('throw if invalid deps received', () => {
    class NoneService {}

    expect(() => {
      serviceProviderFactory({
        deps: [NoneService as any],
        lifetime: 'scoped',
      })((foo) => ({ foo }));
    }).toThrowErrorMatchingInlineSnapshot(
      `"NoneService is not a valid interface"`
    );
  });

  it('throw if invalid lifetime received', () => {
    expect(() =>
      serviceProviderFactory({ lifetime: 'singleton' })(() => 'foo')
    ).not.toThrow();
    expect(() =>
      serviceProviderFactory({ lifetime: 'scoped' })(() => 'foo')
    ).not.toThrow();
    expect(() =>
      serviceProviderFactory({ lifetime: 'transient' })(() => 'foo')
    ).not.toThrow();

    expect(() => {
      serviceProviderFactory({ lifetime: 'halfling' } as never)(() => 'foo');
    }).toThrowErrorMatchingInlineSnapshot(
      `"halfling is not valid service lifetime"`
    );
  });
});
