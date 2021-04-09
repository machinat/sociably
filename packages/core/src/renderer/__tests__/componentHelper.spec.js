import Machinat from '@machinat/core';
import { MACHINAT_NATIVE_TYPE } from '../../symbol';
import {
  annotateNativeComponent,
  makeTextSegment,
  makeBreakSegment,
  makePartSegment,
  makeUnitSegment,
  makePauseSegment,
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

test('makeTextSegment(node, path, text)', () => {
  expect(makeTextSegment(<hello />, '$::1', 'world')).toEqual({
    type: 'text',
    node: <hello />,
    value: 'world',
    path: '$::1',
  });
});

test('makeBreakSegment(node, path)', () => {
  expect(makeBreakSegment(<hello world />, '$::1')).toEqual({
    type: 'break',
    node: <hello world />,
    value: null,
    path: '$::1',
  });
});

test('makePauseSegment(node, path, until)', () => {
  expect(makePauseSegment(<hello />, '$::1')).toEqual({
    type: 'pause',
    node: <hello />,
    value: null,
    path: '$::1',
  });

  const until = async () => 'the_end_of_the_world';
  expect(makePauseSegment(<hello />, '$::1', until)).toEqual({
    type: 'pause',
    node: <hello />,
    value: until,
    path: '$::1',
  });
});

test('makePartSegment(node, path, value)', () => {
  expect(makePartSegment(<hello />, '$::1', { world: 'peace' })).toEqual({
    type: 'part',
    node: <hello />,
    value: { world: 'peace' },
    path: '$::1',
  });
});

test('makeUnitSegment(node, path, value)', () => {
  expect(makeUnitSegment(<hello />, '$::1', { world: 'champion' })).toEqual({
    type: 'unit',
    node: <hello />,
    value: { world: 'champion' },
    path: '$::1',
  });
});
