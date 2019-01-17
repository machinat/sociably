import Machinat from 'machinat';

import { Emoji } from '../text';

import { LINE_NAITVE_TYPE } from '../../symbol';

import render from './render';

describe('Emoji', () => {
  it('is valid native unit component', () => {
    expect(typeof Emoji).toBe('function');

    expect(Emoji.$$native).toBe(LINE_NAITVE_TYPE);
    expect(Emoji.$$entry).toBe(undefined);
    expect(Emoji.$$unit).toBe(true);
  });

  it('renders to corespond unicode char', () => {
    expect(render(<Emoji code={0x100078} />)[0].value).toBe('\u{100078}');
    expect(render(<Emoji code={0x10008b} />)[0].value).toBe('\u{10008b}');
    expect(render(<Emoji code={0x100096} />)[0].value).toBe('\u{100096}');
  });
});
