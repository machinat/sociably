import moxy from 'moxy';
import {
  annotate,
  asNative,
  asUnit,
  hasEntry,
  asContainer,
} from '../annotation';

describe('annotate(...decorators)', () => {
  const Component = () => {};

  const dec1 = moxy();
  const dec2 = moxy();
  const dec3 = moxy();

  expect(annotate(dec1, dec2, dec3)(Component)).toBe(Component);

  expect(dec1.mock).toHaveBeenCalledTimes(1);
  expect(dec2.mock).toHaveBeenCalledTimes(1);
  expect(dec3.mock).toHaveBeenCalledTimes(1);
  expect(dec1.mock).toHaveBeenCalledWith(Component);
  expect(dec2.mock).toHaveBeenCalledWith(Component);
  expect(dec3.mock).toHaveBeenCalledWith(Component);
});

describe('asNative(type)', () => {
  it('annotate $$native attribute', () => {
    const Component = () => {};

    const NATIVE_TYPE = Symbol('my native type');

    asNative(NATIVE_TYPE)(Component);

    expect(Component.$$native).toBe(NATIVE_TYPE);
  });
});

describe('asUnit(isUnit)', () => {
  it('annotate $$unit attribute', () => {
    const Component = () => {};

    asUnit(true)(Component);
    expect(Component.$$unit).toBe(true);

    asUnit(false)(Component);
    expect(Component.$$unit).toBe(false);
  });
});

describe('hasEntry(path)', () => {
  it('annotate $$entry attribute', () => {
    const Component = () => {};

    hasEntry('api/end/point')(Component);
    expect(Component.$$entry).toBe('api/end/point');
  });
});

describe('asContainer(isContainer)', () => {
  it('annotate $$container attribute', () => {
    const Component = () => {};

    asContainer(true)(Component);
    expect(Component.$$container).toBe(true);

    asContainer(false)(Component);
    expect(Component.$$container).toBe(false);
  });
});
