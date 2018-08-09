import Machinat from '../../../machinat';
import { toArray, reduce, map } from '../children';

describe('toArray', () => {
  it('returns [] if children is empty', () => {
    const empties = [
      <text />,
      <text></text>, // eslint-disable-line
      <text>{null}</text>,
      <text>{true}</text>,
      <text>{false}</text>,
      <text>{undefined}</text>,
      <text>{}</text>,
    ];

    empties.forEach(element => {
      expect(toArray(element.props.children)).toEqual([]);
    });
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
            {null}
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
        {null}
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
    expect(count).toBe(7);
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
          {null}
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
    ]);

    const expections = [
      ['first', '$::1'],
      [<a>second</a>, '$::2:0'],
      [<third />, '$::2:1:0'],
      [<i>fourth</i>, '$::3'],
      ['fifth', '$::4::0'],
      [<b>sixth</b>, '$::4::1::0'],
      [<seventh />, '$::5'],
    ];
    expect(callback).toHaveBeenCalledTimes(7);
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
