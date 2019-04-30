import Machinat, { SEGMENT_BREAK } from 'machinat';
import moxy from 'moxy';

import joinTextValues from '../joinTextValues';

it('merge text values', () => {
  const node = [<a />, <b />, <c />];
  const render = moxy(() => [
    { isPause: false, isUnit: true, node: <a />, value: 'A', path: '$::0' },
    { isPause: false, isUnit: true, node: <b />, value: 'B', path: '$::1' },
    { isPause: false, isUnit: true, node: <c />, value: 'C', path: '$::2' },
  ]);
  const path = '.childern';

  expect(joinTextValues(node, render, path)).toEqual(['ABC']);
  expect(render.mock).toHaveBeenCalledTimes(1);
  expect(render.mock).toHaveBeenCalledWith(node, path);
});

it('separate values if SEGMENT_BREAK met', () => {
  const node = [<a />, <b />, <c />];
  const render = moxy(() => [
    { isPause: false, isUnit: true, node: <a />, value: 'A', path: '$::0' },
    { isPause: false, isUnit: true, node: <b />, value: 'B', path: '$::1' },
    {
      isPause: false,
      isUnit: true,
      node: <br />,
      value: SEGMENT_BREAK,
      path: '$::2',
    },
    { isPause: false, isUnit: true, node: <c />, value: 'C', path: '$::3' },
    { isPause: false, isUnit: true, node: <d />, value: 'D', path: '$::4' },
    {
      isPause: false,
      isUnit: true,
      node: <br />,
      value: SEGMENT_BREAK,
      path: '$::5',
    },
    { isPause: false, isUnit: true, node: <e />, value: 'E', path: '$::6' },
    { isPause: false, isUnit: true, node: <f />, value: 'F', path: '$::7' },
  ]);
  const path = '.childern';

  expect(joinTextValues(node, render, path)).toEqual([
    'AB',
    SEGMENT_BREAK,
    'CD',
    SEGMENT_BREAK,
    'EF',
  ]);
  expect(render.mock).toHaveBeenCalledTimes(1);
  expect(render.mock).toHaveBeenCalledWith(node, path);
});

it('throw if non text value met', () => {
  const node = [<a />, <b />, <c />];
  const render = moxy(() => [
    { isPause: false, isUnit: true, node: <a />, value: 'A', path: '$::0' },
    {
      isPause: false,
      isUnit: true,
      node: <b />,
      value: { illegal: 'not text' },
      path: '$::1',
    },
    { isPause: false, isUnit: true, node: <c />, value: 'C', path: '$::2' },
  ]);
  const path = '.childern';

  expect(() =>
    joinTextValues(node, render, path)
  ).toThrowErrorMatchingInlineSnapshot(
    `"<b /> at $::1 is not rendered as text content"`
  );

  expect(render.mock).toHaveBeenCalledTimes(1);
  expect(render.mock).toHaveBeenCalledWith(node, path);
});
