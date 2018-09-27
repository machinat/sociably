import Machinat from '../../../machinat';
import { traverse, toArray, reduce, map } from '../children';

describe('traverse', () => {
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
});

describe('toArray', () => {
  it('returns null or undefined if null or undefined passed', () => {
    expect(toArray(null)).toBe(null);
    expect(toArray(undefined)).toBe(undefined);
  });

  it('returns list of children as array', () => {
    expect(
      toArray(
        (
          <text>
            first
            <a>second</a>
            <third />
          </text>
        ).props.children
      )
    ).toEqual(['first', <a>second</a>, <third />]);
  });

  it("returns fragment's children as array", () => {
    expect(
      toArray(
        (
          <text>
            <>
              first
              <a>second</a>
              <third />
            </>
          </text>
        ).props.children
      )
    ).toEqual(['first', <a>second</a>, <third />]);
  });

  it('returns array of children if only single element contained', () => {
    expect(
      toArray(
        (
          <text>
            <a>bcb</a>
          </text>
        ).props.children
      )
    ).toEqual([<a>bcb</a>]);
  });

  it('flatten nested list of elements', () => {
    expect(
      toArray(
        (
          <text>
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
          </text>
        ).props.children
      )
    ).toEqual([
      'first',
      <a>second</a>,
      <third />,
      <i>fourth</i>,
      'fifth',
      <b>sixth</b>,
      <seventh />,
      { n: 'eight' },
    ]);
  });
});

describe('reduce', () => {
  it('returns null or undefined if null or undefined passed', () => {
    const callback = jest.fn();
    expect(reduce(null, callback)).toBe(null);
    expect(reduce(undefined, callback)).toBe(undefined);
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
});

describe('map', () => {
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
});
