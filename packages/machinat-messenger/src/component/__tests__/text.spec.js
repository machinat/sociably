import moxy from 'moxy';
import Machinat from 'machinat';
import { reduce } from 'machinat-children';

import { MESSENGER_NAITVE_TYPE } from '../../symbol';
import { Latex } from '../text';

import renderHelper from './renderHelper';

const renderInner = moxy(node =>
  reduce(
    node,
    (rendered, element) =>
      rendered.concat([
        {
          value: typeof element === 'string' ? element : element.props.children,
          element,
        },
      ]),
    []
  )
);

const render = renderHelper(renderInner);

describe('Latex', () => {
  it('is valid root Component', () => {
    expect(typeof Latex).toBe('function');
    expect(Latex.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Latex.$$entry).toBe(undefined);
    expect(Latex.$$unit).toBe(true);
  });

  it('render children as "text" field', () => {
    expect(render(<Latex>some text</Latex>)).toEqual(['\\(some text\\)']);
    expect(renderInner.mock).toHaveBeenCalledTimes(1);

    expect(
      render(
        <Latex>
          <a>abcd</a>
          <b>efgh</b>
          <c>ijkl</c>
        </Latex>
      )
    ).toEqual([`\\(abcdefghijkl\\)`]);
    expect(renderInner.mock).toHaveBeenCalledTimes(2);
  });
});
