import toArray from '../toArray.js';

declare module '@sociably/core/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      a: { id?: number; children?: unknown };
      text: { children?: unknown };
      third: object;
      seventh: object;
    }
  }
}

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
      ).props.children,
    ),
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
      ).props.children,
    ),
  ).toEqual(['first', <a>second</a>, <third />]);
});

it('returns array of children if only single element contained', () => {
  expect(
    toArray(
      (
        <text>
          <a>bcb</a>
        </text>
      ).props.children,
    ),
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
      ).props.children,
    ),
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
