import Machinat from '../..';
import reduce from '../reduce';

it('returns initial value if null or undefined passed', () => {
  const callback = jest.fn();
  const initial = { foo: 'bar' };
  expect(reduce(null, callback, initial)).toBe(initial);
  expect(reduce(undefined, callback, initial)).toBe(initial);
  expect(callback).not.toHaveBeenCalled();
});

it('travers through all elements', () => {
  const _context = {};
  const expections = [
    ['first', '$::1'],
    [<a>second</a>, '$::2:0'],
    [<third />, '$::2:1:0'],
    [<i>fourth</i>, '$::3'],
    ['fifth', '$::4::0'],
    [<b>sixth</b>, '$::4::1::0'],
    [<seventh />, '$::5'],
    [{ n: 'eight' }, '$::7'],
  ];
  const count = reduce(
    <>
      {null}
      first
      {[<a>second</a>, [<third />]]}
      <i>fourth</i>
      <>
        fifth
        <>
          <b>sixth</b>
        </>
      </>
      <seventh />
      {undefined}
      {{ n: 'eight' }}
      {true}
      {false}
    </>,
    (i, element, path, context) => {
      expect(element).toEqual(expections[i][0]);
      expect(path).toEqual(expections[i][1]);
      expect(context).toBe(_context);
      return i + 1;
    },
    0,
    '$',
    _context
  );
  expect(count).toBe(8);
});
