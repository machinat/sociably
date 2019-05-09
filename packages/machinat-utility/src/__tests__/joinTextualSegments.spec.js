import Machinat, { SEGMENT_BREAK } from 'machinat';

import joinTextualSegments from '../joinTextualSegments';

it('merge text values', () => {
  const segments = [
    { type: 'text', node: <a />, value: 'A', path: '$::0' },
    { type: 'text', node: <b />, value: 'B', path: '$::1' },
    { type: 'text', node: <c />, value: 'C', path: '$::2' },
  ];

  expect(joinTextualSegments(segments, <abc />, '$')).toEqual([
    { type: 'text', node: <abc />, value: 'ABC', path: '$' },
  ]);
});

it('separate values if SEGMENT_BREAK met', () => {
  const segments = [
    { type: 'text', node: <a />, value: 'A', path: '$::0' },
    { type: 'text', node: <b />, value: 'B', path: '$::1' },
    { type: 'break', node: <br />, value: SEGMENT_BREAK, path: '$::2' },
    { type: 'text', node: <c />, value: 'C', path: '$::3' },
    { type: 'text', node: <d />, value: 'D', path: '$::4' },
    { type: 'break', node: <br />, value: SEGMENT_BREAK, path: '$::5' },
    { type: 'text', node: <e />, value: 'E', path: '$::6' },
    { type: 'text', node: <f />, value: 'F', path: '$::7' },
  ];

  expect(joinTextualSegments(segments, <abcdef />, '$')).toEqual([
    { type: 'text', node: <abcdef />, value: 'AB', path: '$' },
    { type: 'break', node: <br />, value: SEGMENT_BREAK, path: '$::2' },
    { type: 'text', node: <abcdef />, value: 'CD', path: '$' },
    { type: 'break', node: <br />, value: SEGMENT_BREAK, path: '$::5' },
    { type: 'text', node: <abcdef />, value: 'EF', path: '$' },
  ]);
});

it('throw if non text value met', () => {
  const segments = [
    { type: 'text', node: <a />, value: 'A', path: '$::0' },
    {
      type: 'part',
      node: <b />,
      value: { illegal: 'not text' },
      path: '$::1',
    },
    { type: 'text', node: <c />, value: 'C', path: '$::2' },
  ];

  expect(() =>
    joinTextualSegments(segments, <abc />, '$')
  ).toThrowErrorMatchingInlineSnapshot(
    `"<b /> at $::1 is not valid textual content"`
  );
});
