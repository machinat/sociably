import {
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_ABSTRACTION,
  MACHINAT_SERVICES_INTERFACEABLE,
} from '../../symbol';
import { inject, provider, abstract, namedInterface } from '../annotate';

const FooServiceI = {
  $$typeof: MACHINAT_SERVICES_PROVIDER,
  /* ... */
};
const BarServiceI = {
  $$typeof: MACHINAT_SERVICES_ABSTRACTION,
  /* ... */
};
const BazServiceI = {
  $$typeof: MACHINAT_SERVICES_INTERFACEABLE,
  /* ... */
};

describe('inject({ deps })(fn)', () => {
  it('annotate deps of container', () => {
    const containerFn = () => {};

    const container = inject({
      deps: [
        FooServiceI,
        { require: BarServiceI, optional: false },
        { require: BazServiceI, optional: true },
      ],
    })(containerFn);

    expect(container).toBe(containerFn);
    expect(container.$$typeof).toBe(MACHINAT_SERVICES_CONTAINER);
    expect(container.$$deps).toEqual([
      { require: FooServiceI, optional: false },
      { require: BarServiceI, optional: false },
      { require: BazServiceI, optional: true },
    ]);
  });

  it('throw if invalid deps received', () => {
    class WhateverClass {}

    expect(() => {
      inject({ deps: [WhateverClass] })(_whatever => 'boom');
    }).toThrowErrorMatchingInlineSnapshot(
      `"WhateverClass is not a valid interfaceable"`
    );
  });
});

describe('provider({ deps, factory, strategy })(klass)', () => {
  it('annotate deps, factory and strategy at class', () => {
    class MyService {}
    const factory = (foo, bar, baz) => new MyService(foo, bar, baz);

    const MyProvider = provider({
      factory,
      deps: [
        FooServiceI,
        { require: BarServiceI, optional: false },
        { require: BazServiceI, optional: true },
      ],
      strategy: 'scoped',
    })(MyService);

    expect(MyProvider).toBe(MyService);
    expect(MyProvider.$$typeof).toBe(MACHINAT_SERVICES_PROVIDER);
    expect(MyProvider.$$deps).toEqual([
      { require: FooServiceI, optional: false },
      { require: BarServiceI, optional: false },
      { require: BazServiceI, optional: true },
    ]);
    expect(MyProvider.$$factory).toBe(factory);
    expect(MyProvider.$$strategy).toBe('scoped');
  });

  it('throw if invalid deps received', () => {
    class WhateverClass {}

    expect(() => {
      provider({
        deps: [WhateverClass],
        factory: _whatever => 'boom',
        strategy: 'singleton',
      })(class MyProvider {});
    }).toThrowErrorMatchingInlineSnapshot(
      `"WhateverClass is not a valid interfaceable"`
    );
  });
});

describe('abstract()(klass)', () => {
  it('annotate $$typeof as class', () => {
    class MyAbstractClass {}
    const MyAbstractClassI = abstract()(MyAbstractClass);

    expect(MyAbstractClassI).toBe(MyAbstractClass);
    expect(MyAbstractClassI.$$typeof).toBe(MACHINAT_SERVICES_ABSTRACTION);
  });
});

describe('namedInterface(name)', () => {
  it('create annotation', () => {
    const MyFooInterface = namedInterface('foo');

    expect(MyFooInterface).toEqual({
      $$typeof: MACHINAT_SERVICES_INTERFACEABLE,
      name: 'foo',
    });
  });
});
