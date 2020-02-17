import Machinat from '../..';
import map from '../map';

it('maps all elements', () => {
  const callback = jest.fn(e => ({ e }));
  const context = {};
  expect(
    map(
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
      callback,
      '$',
      context
    )
  ).toEqual([
    { e: 'first' },
    { e: <a>second</a> },
    { e: <third /> },
    { e: <i>fourth</i> },
    { e: 'fifth' },
    { e: <b>sixth</b> },
    { e: <seventh /> },
    { e: { n: 'eight' } },
  ]);

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
  expect(callback).toHaveBeenCalledTimes(8);
  callback.mock.calls.forEach((param, i) => {
    expect(param[0]).toEqual(expections[i][0]);
    expect(param[1]).toBe(expections[i][1]);
    expect(param[2]).toBe(context);
  });
});

it('returns null or undefined if null or undefined passed', () => {
  const callback = jest.fn();
  expect(map(null, callback)).toBe(null);
  expect(map(undefined, callback)).toBe(undefined);
  expect(callback).not.toHaveBeenCalled();
});
