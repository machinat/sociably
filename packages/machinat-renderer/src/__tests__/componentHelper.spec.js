import moxy from 'moxy';
import Machinat, { MACHINAT_NATIVE_TYPE } from 'machinat';

import {
  asNative,
  asNamespace,
  annotate,
  wrapSinglePartSegment,
  wrapSingleUnitSegment,
} from '../componentHelper';

describe('asNative(sym)(_component)', () => {
  it('set "$$native" as the sign for native component', () => {
    const _component = () => {};
    const sign = Symbol('foo');

    const Component = asNative(sign)(_component);

    expect(Component).toBe(_component);
    expect(Component.$$native).toBe(sign);
    expect(Component.$$typeof).toBe(MACHINAT_NATIVE_TYPE);
  });
});

describe('asNamespace(name)(_component)', () => {
  it('set "$$namespace" as the sign for native component', () => {
    const _component = () => {};

    const Component = asNamespace('MyFoo')(_component);

    expect(Component).toBe(_component);
    expect(Component.$$namespace).toBe('MyFoo');
  });
});

describe('annotate(key)(value)(_component)', () => {
  it('set the value to key prop on native component', () => {
    const _component = () => {};

    const Component = annotate('foo', 'bar')(_component);

    expect(Component).toBe(_component);
    expect(Component.foo).toBe('bar');
  });
});

describe('wrapSinglePartSegment(_component)', () => {
  it('wrap the values resolved by underlying function into part segment', async () => {
    const _component = moxy(() => Promise.resolve({ foo: 'bar' }));
    _component.mock.getter('name').fakeReturnValue('MyComponent');

    const Component = wrapSinglePartSegment(_component);
    expect(Component.name).toBe('MyComponent');

    await expect(Component(<Component />, null, '$')).resolves.toEqual([
      {
        type: 'part',
        node: <Component />,
        value: { foo: 'bar' },
        path: '$',
      },
    ]);

    expect(_component.mock).toHaveBeenCalledWith(<Component />, null, '$');
  });

  it('returns null if underlying value function returns null', async () => {
    const _component = moxy(() => null);
    _component.mock.getter('name').fakeReturnValue('MyComponent');
    const Component = wrapSinglePartSegment(_component);

    await expect(Component(null, null, '$')).resolves.toEqual(null);
    expect(_component.mock).toHaveBeenCalledWith(null, null, '$');
  });
});

describe('wrapSingleUnitSegment(_component)', () => {
  it('wrap the values resolved by underlying function into unit segment', async () => {
    const _component = moxy(() => ({ foo: 'bar' }));
    _component.mock.getter('name').fakeReturnValue('MyComponent');

    const Component = wrapSingleUnitSegment(_component);
    expect(Component.name).toBe('MyComponent');

    await expect(Component(<Component />, null, '$')).resolves.toEqual([
      {
        type: 'unit',
        node: <Component />,
        value: { foo: 'bar' },
        path: '$',
      },
    ]);

    expect(_component.mock).toHaveBeenCalledWith(<Component />, null, '$');
  });

  it('returns null if underlying value function returns null', async () => {
    const _component = moxy(() => null);
    _component.mock.getter('name').fakeReturnValue('MyComponent');
    const Component = wrapSingleUnitSegment(_component);

    await expect(Component(null, null, '$')).resolves.toEqual(null);
    expect(_component.mock).toHaveBeenCalledWith(null, null, '$');
  });
});
