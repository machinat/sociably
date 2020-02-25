import moxy from 'moxy';
import Machinat from '../..';
import { MACHINAT_NATIVE_TYPE } from '../../symbol';

import {
  annotateNativeComponent,
  wrapContainerComponent,
  wrapPartComponent,
  wrapUnitComponent,
} from '../componentHelper';

const render = moxy();

describe('asNativeConponent(platform)(componentFn)', () => {
  it('set "$$native" as the sign for native component', () => {
    const _component = () => {};

    const Component = annotateNativeComponent('foo')(_component);

    expect(Component).toBe(_component);
    expect(Component.$$platform).toBe('foo');
    expect(Component.$$typeof).toBe(MACHINAT_NATIVE_TYPE);
  });
});

describe('wrapContainerComponent(_component)', () => {
  it('pass props to underlying component', async () => {
    const rendered = [
      { type: 'text', value: 'foo', node: 'foo', path: '$#MyComponent.foo' },
      {
        type: 'unit',
        value: { bar: 'yes' },
        node: <bar />,
        path: '$#MyComponent.bar',
      },
    ];
    const _component = moxy(function MyComponent() {
      return Promise.resolve(rendered);
    });

    const Component = wrapContainerComponent(_component);
    expect(Component.name).toBe('MyComponent');

    await expect(
      Component(<Component foo="bar" />, render, '$')
    ).resolves.toEqual(rendered);

    expect(_component.mock).toHaveBeenCalledWith({ foo: 'bar' }, render, '$');
  });

  it('returns null if underlying value function returns null', async () => {
    const _component = moxy(() => null);
    const Component = wrapContainerComponent(_component);

    await expect(Component(<Component />, render, '$')).resolves.toEqual(null);
    expect(_component.mock).toHaveBeenCalledWith({}, render, '$');
  });
});

describe('wrapPartComponent(_component)', () => {
  it('wrap the values resolved by underlying function into unit segment', async () => {
    const _component = moxy(function MyComponent(props) {
      return Promise.resolve(props);
    });

    const Component = wrapPartComponent(_component);
    expect(Component.name).toBe('MyComponent');

    await expect(
      Component(<Component foo="bar" />, render, '$')
    ).resolves.toEqual([
      {
        type: 'part',
        node: <Component foo="bar" />,
        value: { foo: 'bar' },
        path: '$',
      },
    ]);

    expect(_component.mock).toHaveBeenCalledWith({ foo: 'bar' }, render, '$');
  });

  it('returns null if underlying value function returns null', async () => {
    const _component = moxy(() => Promise.resolve(null));
    const Component = wrapPartComponent(_component);

    await expect(Component(<Component />, render, '$')).resolves.toEqual(null);
    expect(_component.mock).toHaveBeenCalledWith({}, render, '$');
  });
});

describe('wrapUnitComponent(_component)', () => {
  it('wrap the values resolved by underlying function into unit segment', async () => {
    const _component = moxy(function MyComponent(props) {
      return Promise.resolve(props);
    });

    const Component = wrapUnitComponent(_component);
    expect(Component.name).toBe('MyComponent');

    await expect(
      Component(<Component foo="bar" />, render, '$')
    ).resolves.toEqual([
      {
        type: 'unit',
        node: <Component foo="bar" />,
        value: { foo: 'bar' },
        path: '$',
      },
    ]);

    expect(_component.mock).toHaveBeenCalledWith({ foo: 'bar' }, render, '$');
  });

  it('returns null if underlying value function returns null', async () => {
    const _component = moxy(() => Promise.resolve(null));
    const Component = wrapUnitComponent(_component);

    await expect(Component(<Component />, render, '$')).resolves.toEqual(null);
    expect(_component.mock).toHaveBeenCalledWith({}, render, '$');
  });
});
