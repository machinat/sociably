import Machinat from '..';
import createElement from '../createElement';
import { MACHINAT_ELEMENT_TYPE } from '../symbol';

it('returns element object', () => {
  expect(createElement('text', { a: 1 }, 'abc')).toEqual({
    $$typeof: MACHINAT_ELEMENT_TYPE,
    type: 'text',
    props: { a: 1, children: 'abc' },
  });

  expect(createElement('text', { a: 1 }, 'a', 'b', 'c')).toEqual({
    $$typeof: MACHINAT_ELEMENT_TYPE,
    type: 'text',
    props: { a: 1, children: ['a', 'b', 'c'] },
  });
});

it('works as the pragma for jsx transpiliing', () => {
  expect(<text />).toEqual({
    $$typeof: MACHINAT_ELEMENT_TYPE,
    type: 'text',
    props: {},
  });

  expect(<text>abc</text>).toEqual({
    $$typeof: MACHINAT_ELEMENT_TYPE,
    type: 'text',
    props: { children: 'abc' },
  });
});
