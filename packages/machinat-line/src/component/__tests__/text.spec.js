import Machinat from 'machinat';

import { LINE_NATIVE_TYPE } from '../../constant';
import { Emoji } from '../text';
import renderHelper from './renderHelper';

const render = renderHelper(() => null);

describe('Emoji', () => {
  it('is valid native unit component', () => {
    expect(typeof Emoji).toBe('function');

    expect(Emoji.$$native).toBe(LINE_NATIVE_TYPE);
    expect(Emoji.$$getEntry).toBe(undefined);
  });

  it('renders ok', () => {
    const emoji = <Emoji code={0x100078} />;
    const segments = render(emoji);
    expect(segments.length).toBe(1);

    const [segment] = segments;
    expect(segment.type).toBe('text');
    expect(segment.node).toBe(emoji);
    expect(segment.path).toBe('$');
    expect(typeof segment.value).toBe('string');
  });

  it('renders to corespond unicode char', () => {
    expect(render(<Emoji code={0x100078} />)[0].value).toBe('\u{100078}');
    expect(render(<Emoji code={0x10008b} />)[0].value).toBe('\u{10008b}');
    expect(render(<Emoji code={0x100096} />)[0].value).toBe('\u{100096}');
  });
});
