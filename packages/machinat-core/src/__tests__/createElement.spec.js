import Machinat from '..';
import createElement from '../createElement';

it('returns element object', () => {
  expect(createElement('text', { a: 1 }, 'abc')).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: { a: 1, children: 'abc' },
  });

  expect(createElement('text', { a: 1 }, 'a', 'b', 'c')).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: { a: 1, children: ['a', 'b', 'c'] },
  });
});

it('works as the pragma for jsx transpiliing', () => {
  expect(<text />).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: {},
  });

  expect(<text>abc</text>).toEqual({
    $$typeof: Symbol.for('machinat.element'),
    type: 'text',
    props: { children: 'abc' },
  });
});
