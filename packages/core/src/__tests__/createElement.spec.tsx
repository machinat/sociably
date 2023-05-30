import Sociably from '../index.js';
import createElement from '../createElement.js';
import { SOCIABLY_ELEMENT_TYPE } from '../symbol.js';

it('returns element object', () => {
  expect(createElement('text', { a: 1 }, 'abc')).toEqual({
    $$typeof: SOCIABLY_ELEMENT_TYPE,
    type: 'text',
    props: { a: 1, children: 'abc' },
  });

  expect(createElement('text', { a: 1 }, 'a', 'b', 'c')).toEqual({
    $$typeof: SOCIABLY_ELEMENT_TYPE,
    type: 'text',
    props: { a: 1, children: ['a', 'b', 'c'] },
  });
});

it('works as the pragma for jsx transpiliing', () => {
  expect(<text />).toEqual({
    $$typeof: SOCIABLY_ELEMENT_TYPE,
    type: 'text',
    props: {},
  });

  expect(<text>abc</text>).toEqual({
    $$typeof: SOCIABLY_ELEMENT_TYPE,
    type: 'text',
    props: { children: 'abc' },
  });
});
