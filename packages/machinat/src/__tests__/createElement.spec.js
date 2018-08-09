import Machinat from '../';
import createElement from '../createElement';

it('returns element object', () => {
  expect(createElement('text', { a: 1 }, 'abc')).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: { a: 1, children: 'abc' },
    async: false,
  });

  expect(createElement('text', { a: 1 }, 'a', 'b', 'c')).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: { a: 1, children: ['a', 'b', 'c'] },
    async: false,
  });

  expect(createElement('text', { a: 1, async: true }, 'abc')).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: { a: 1, children: 'abc' },
    async: true,
  });
});

it('works as the pragma for jsx transpiliing', () => {
  expect(<text />).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: {},
    async: false,
  });

  expect(<text>abc</text>).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: { children: 'abc' },
    async: false,
  });

  expect(
    <text async a={0}>
      abc
    </text>
  ).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: { children: 'abc', a: 0 },
    async: true,
  });
});
