import moxy from 'moxy';
import Machinat from 'machinat';

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
  it('wrap the values retruned by underlying function into part segment', () => {
    const _component = moxy(() => ({ foo: 'bar' }));
    _component.mock.getter('name').fakeReturnValue('MyComponent');
    const Component = wrapSinglePartSegment(_component);

    expect(Component.name).toBe('MyComponent');
    expect(Component(<Component />, null, '$')).toEqual([
      {
        type: 'part',
        node: <Component />,
        value: { foo: 'bar' },
        path: '$',
      },
    ]);

    expect(_component.mock).toHaveBeenCalledWith(<Component />, null, '$');
  });

  it('returns null if underlying value function returns null', () => {
    const _component = moxy(() => null);
    _component.mock.getter('name').fakeReturnValue('MyComponent');
    const Component = wrapSinglePartSegment(_component);

    expect(Component(null, null, '$')).toEqual(null);
    expect(_component.mock).toHaveBeenCalledWith(null, null, '$');
  });
});

describe('wrapSingleUnitSegment(_component)', () => {
  it('wrap the values retruned by underlying function into unit segment', () => {
    const _component = moxy(() => ({ foo: 'bar' }));
    _component.mock.getter('name').fakeReturnValue('MyComponent');
    const Component = wrapSingleUnitSegment(_component);

    expect(Component.name).toBe('MyComponent');
    expect(Component(<Component />, null, '$')).toEqual([
      {
        type: 'unit',
        node: <Component />,
        value: { foo: 'bar' },
        path: '$',
      },
    ]);

    expect(_component.mock).toHaveBeenCalledWith(<Component />, null, '$');
  });

  it('returns null if underlying value function returns null', () => {
    const _component = moxy(() => null);
    _component.mock.getter('name').fakeReturnValue('MyComponent');
    const Component = wrapSingleUnitSegment(_component);

    expect(Component.name).toBe('MyComponent');
    expect(Component(null, null, '$')).toEqual(null);
    expect(_component.mock).toHaveBeenCalledWith(null, null, '$');
  });
});
