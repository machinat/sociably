import Machinat from 'machinat';
import moxy from 'moxy';

import joinTextValues from '../joinTextValues';
import { ACTION_BREAK } from '../symbol';

it('merge text values', () => {
  const node = [<a />, <b />, <c />];
  const render = moxy(() => [
    { isPause: false, isUnit: true, element: <a />, value: 'A', path: '$::0' },
    { isPause: false, isUnit: true, element: <b />, value: 'B', path: '$::1' },
    { isPause: false, isUnit: true, element: <c />, value: 'C', path: '$::2' },
  ]);
  const path = '.childern';

  expect(joinTextValues(node, render, path)).toEqual(['ABC']);
  expect(render.mock).toHaveBeenCalledTimes(1);
  expect(render.mock).toHaveBeenCalledWith(node, path);
});

it('separate values if ACTION_BREAK met', () => {
  const node = [<a />, <b />, <c />];
  const render = moxy(() => [
    { isPause: false, isUnit: true, element: <a />, value: 'A', path: '$::0' },
    { isPause: false, isUnit: true, element: <b />, value: 'B', path: '$::1' },
    {
      isPause: false,
      isUnit: true,
      element: <br />,
      value: ACTION_BREAK,
      path: '$::2',
    },
    { isPause: false, isUnit: true, element: <c />, value: 'C', path: '$::3' },
    { isPause: false, isUnit: true, element: <d />, value: 'D', path: '$::4' },
    {
      isPause: false,
      isUnit: true,
      element: <br />,
      value: ACTION_BREAK,
      path: '$::5',
    },
    { isPause: false, isUnit: true, element: <e />, value: 'E', path: '$::6' },
    { isPause: false, isUnit: true, element: <f />, value: 'F', path: '$::7' },
  ]);
  const path = '.childern';

  expect(joinTextValues(node, render, path)).toEqual([
    'AB',
    ACTION_BREAK,
    'CD',
    ACTION_BREAK,
    'EF',
  ]);
  expect(render.mock).toHaveBeenCalledTimes(1);
  expect(render.mock).toHaveBeenCalledWith(node, path);
});

it('throw if non text value met', () => {
  const node = [<a />, <b />, <c />];
  const render = moxy(() => [
    { isPause: false, isUnit: true, element: <a />, value: 'A', path: '$::0' },
    {
      isPause: false,
      isUnit: true,
      element: <b />,
      value: { illegal: 'not text' },
      path: '$::1',
    },
    { isPause: false, isUnit: true, element: <c />, value: 'C', path: '$::2' },
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
