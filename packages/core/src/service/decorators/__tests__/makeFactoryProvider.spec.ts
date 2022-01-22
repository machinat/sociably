import moxy from '@moxyjs/moxy';
import {
  MACHINAT_SERVICE_PROVIDER,
  MACHINAT_SERVICE_INTERFACE,
} from '../../../symbol';
import makeFactoryProvider from '../makeFactoryProvider';

const FooServiceI = {
  $$typeof: MACHINAT_SERVICE_PROVIDER,
  /* ... */
} as any;
const BarServiceI = {
  $$typeof: MACHINAT_SERVICE_INTERFACE,
  /* ... */
} as any;
const BazServiceI = {
  $$typeof: MACHINAT_SERVICE_INTERFACE,
  /* ... */
} as any;

describe('makeFactoryProvider({ deps, lifetime })(factory)', () => {
  it('annotate metadatas', () => {
    const factoryFn = moxy(function factoryFn(foo, bar, baz) {
      return { foo, bar, baz };
    });

    const factoryProvider = makeFactoryProvider({
      name: 'myFactory',
      deps: [
        FooServiceI,
        { require: BarServiceI, optional: false },
        { require: BazServiceI, optional: true },
      ],
      lifetime: 'transient',
    })(factoryFn);

    expect(factoryProvider).toBe(factoryFn);
    expect(factoryProvider.$$typeof).toBe(MACHINAT_SERVICE_PROVIDER);
    expect(factoryProvider.$$name).toBe('myFactory');
    expect(factoryProvider.$$deps).toEqual([
      { require: FooServiceI, optional: false },
      { require: BarServiceI, optional: false },
      { require: BazServiceI, optional: true },
    ]);
    expect(factoryProvider.$$factory).toBe(factoryFn);
    expect(factoryProvider.$$lifetime).toBe('transient');

    expect(factoryProvider(0, 1, 2)).toEqual({ foo: 0, bar: 1, baz: 2 });
    expect(factoryFn.mock).toHaveBeenCalledTimes(1);
    expect(factoryFn.mock).toHaveBeenCalledWith(0, 1, 2);
  });

  test('default properties', () => {
    const providerFactory = makeFactoryProvider({})(function factoryFn() {});

    expect(providerFactory.$$lifetime).toBe('transient');
    expect(providerFactory.$$name).toBe('factoryFn');
    expect(providerFactory.$$deps).toEqual([]);
  });

  it('throw if invalid deps received', () => {
    class NoneService {}

    expect(() => {
      makeFactoryProvider({
        deps: [NoneService as any],
        lifetime: 'scoped',
      })((foo) => ({ foo }));
    }).toThrowErrorMatchingInlineSnapshot(
      `"NoneService is not a valid interface"`
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
