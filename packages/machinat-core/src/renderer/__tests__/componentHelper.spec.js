import Machinat from '@machinat/core';
import { MACHINAT_NATIVE_TYPE } from '../../symbol';
import {
  annotateNativeComponent,
  textSegment,
  breakSegment,
  partSegment,
  unitSegment,
  pauseSegment,
} from '../componentHelper';

describe('asNativeConponent(platform)(componentFn)', () => {
  it('define "$$native" and "$$platform" metadata property', () => {
    const _component = () => {};

    const Component = annotateNativeComponent('foo')(_component);

    expect(Component).toBe(_component);
    expect(Component.$$platform).toBe('foo');
    expect(Component.$$typeof).toBe(MACHINAT_NATIVE_TYPE);
  });
});

test('textSegment(node, path, text)', () => {
  expect(textSegment(<hello />, '$::1', 'world')).toEqual({
    type: 'text',
    node: <hello />,
    value: 'world',
    path: '$::1',
  });
});

test('breakSegment(node, path)', () => {
  expect(breakSegment(<hello world />, '$::1')).toEqual({
    type: 'break',
    node: <hello world />,
    value: null,
    path: '$::1',
  });
});

test('pauseSegment(node, path, until)', () => {
  expect(pauseSegment(<hello />, '$::1')).toEqual({
    type: 'pause',
    node: <hello />,
    value: null,
    path: '$::1',
  });

  const until = async () => 'the_end_of_the_world';
  expect(pauseSegment(<hello />, '$::1', until)).toEqual({
    type: 'pause',
    node: <hello />,
    value: until,
    path: '$::1',
  });
});

test('partSegment(node, path, value)', () => {
  expect(partSegment(<hello />, '$::1', { world: 'peace' })).toEqual({
    type: 'part',
    node: <hello />,
    value: { world: 'peace' },
    path: '$::1',
  });
});

test('unitSegment(node, path, value)', () => {
  expect(unitSegment(<hello />, '$::1', { world: 'champion' })).toEqual({
    type: 'unit',
    node: <hello />,
    value: { world: 'champion' },
    path: '$::1',
  });
});
