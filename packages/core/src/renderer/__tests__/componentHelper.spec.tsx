import Sociably from '@sociably/core';
import { SOCIABLY_NATIVE_TYPE } from '../../symbol.js';
import {
  makeNativeComponent,
  makeTextSegment,
  makeBreakSegment,
  makePartSegment,
  makeUnitSegment,
  makePauseSegment,
} from '../componentHelper.js';

describe('makeNativeComponent(platform)(componentOrFn)', () => {
  function ComponentImpl() {
    return null;
  }

  it('make native component object with implementation function', () => {
    const Component = makeNativeComponent('foo')(ComponentImpl);

    expect(typeof Component).toBe('object');
    expect(Component.$$render).toBe(ComponentImpl);
    expect(Component.$$platform).toBe('foo');
    expect(Component.$$typeof).toBe(SOCIABLY_NATIVE_TYPE);
    expect(Component.$$name).toBe('ComponentImpl');
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
  expect(makeBreakSegment(<hello />, '$::1')).toEqual({
    type: 'break',
    node: <hello />,
    value: null,
    path: '$::1',
  });
});

test('makePauseSegment(node, path, waitFn)', () => {
  expect(makePauseSegment(<hello />, '$::1')).toEqual({
    type: 'pause',
    node: <hello />,
    value: null,
    path: '$::1',
  });

  const waitFn = async () => 'the_end_of_the_world';
  expect(makePauseSegment(<hello />, '$::1', waitFn)).toEqual({
    type: 'pause',
    node: <hello />,
    value: waitFn,
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
