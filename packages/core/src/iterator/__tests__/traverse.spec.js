import Machinat from '../..';
import traverse from '../traverse';

it('traverse through node tree and pass all non empty element to callback', () => {
  const context = {};
  const callback = jest.fn();
  expect(
    traverse(
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
      '$',
      context,
      callback
    )
  ).toBe(8);

  expect(callback.mock.calls).toEqual([
    ['first', '$::1', context],
    [<a>second</a>, '$::2:0', context],
    [<third />, '$::2:1:0', context],
    [<i>fourth</i>, '$::3', context],
    ['fifth', '$::4::0', context],
    [<b>sixth</b>, '$::4::1::0', context],
    [<seventh />, '$::5', context],
    [{ n: 'eight' }, '$::7', context],
  ]);
});

test('if a Fragment contains only one child, path be shown as first children', () => {
  const context = {};
  const callback = jest.fn();
  expect(traverse(<>hello</>, '$', context, callback)).toBe(1);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith('hello', '$::0', context);
});
