import moxy from 'moxy';
import Machinat from 'machinat';

import {
  asNative,
  asNamespace,
  annotate,
  wrapPartSegment,
  wrapUnitSegment,
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

describe('wrapPartSegment(_component)', () => {
  it('wrap the values retruned by underlying function into part segment', () => {
    const _component = moxy(() => ['foo', 'bar']);
    const render = () => null;
    _component.mock.getter('name').fakeReturnValue('MyComponent');

    const Component = wrapPartSegment(_component);

    expect(Component.name).toBe('MyComponent');
    expect(Component(<Component />, render, '$')).toEqual([
      { type: 'part', node: <Component />, value: 'foo', path: '$' },
      { type: 'part', node: <Component />, value: 'bar', path: '$' },
    ]);

    expect(_component.mock).toHaveBeenCalledWith(<Component />, render, '$');
  });
});

describe('wrapUnitSegment(_component)', () => {
  it('wrap the values retruned by underlying function into unit segment', () => {
    const _component = moxy(() => ['foo', 'bar']);
    _component.mock.getter('name').fakeReturnValue('MyComponent');
    const render = () => null;

    const Component = wrapUnitSegment(_component);
    expect(Component.name).toBe('MyComponent');

    expect(Component(<Component />, render, '$')).toEqual([
      { type: 'unit', node: <Component />, value: 'foo', path: '$' },
      { type: 'unit', node: <Component />, value: 'bar', path: '$' },
    ]);

    expect(_component.mock).toHaveBeenCalledWith(<Component />, render, '$');
  });
});
