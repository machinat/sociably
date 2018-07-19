import createElement from '../createElement';

it('returns element object', () => {
  expect(createElement('text', { a: 1 }, 'abc')).toEqual({
    type: 'text',
    props: { a: 1, children: 'abc' },
    async: false,
  });

  expect(createElement('text', { a: 1 }, 'a', 'b', 'c')).toEqual({
    type: 'text',
    props: { a: 1, children: ['a', 'b', 'c'] },
    async: false,
  });

  expect(createElement('text', { a: 1, async: true }, 'abc')).toEqual({
    type: 'text',
    props: { a: 1, children: 'abc' },
    async: true,
  });
});

it('works as the pragma for jsx transpiliing', () => {
  expect(<text />).toEqual({
    type: 'text',
    props: {},
    async: false,
  });

  expect(<text>abc</text>).toEqual({
    type: 'text',
    props: { children: 'abc' },
    async: false,
  });

  expect(
    <text async a={0}>
      abc
    </text>
  ).toEqual({
    type: 'text',
    props: { children: 'abc', a: 0 },
    async: true,
  });
});
