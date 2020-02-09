import moxy from 'moxy';
import Machinat from '../..';
import { MACHINAT_NATIVE_TYPE } from '../../symbol';

import {
  asNativeComponent,
  wrapSinglePartSegment,
  wrapSingleUnitSegment,
} from '../componentHelper';

describe('asNativeConponent(platform)(componentFn)', () => {
  it('set "$$native" as the sign for native component', () => {
    const _component = () => {};

    const Component = asNativeComponent('foo')(_component);

    expect(Component).toBe(_component);
    expect(Component.$$platform).toBe('foo');
    expect(Component.$$typeof).toBe(MACHINAT_NATIVE_TYPE);
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
