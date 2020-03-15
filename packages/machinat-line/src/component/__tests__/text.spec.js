import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeElement } from '@machinat/core/utils/isXxx';
import { Emoji } from '../text';

const renderer = new Renderer('line', () => null);

describe('Emoji', () => {
  it('is valid native unit component', () => {
    expect(typeof Emoji).toBe('function');

    expect(isNativeElement(<Emoji />)).toBe(true);
    expect(Emoji.$$platform).toBe('line');
  });

  it('renders to corespond unicode char', async () => {
    await expect(renderer.render(<Emoji code={0x100078} />)).resolves.toEqual([
      {
        type: 'text',
        node: <Emoji code={0x100078} />,
        value: '\u{100078}',
        path: '$',
      },
    ]);
    await expect(renderer.render(<Emoji code={0x10008b} />)).resolves.toEqual([
      {
        type: 'text',
        node: <Emoji code={0x10008b} />,
        value: '\u{10008b}',
        path: '$',
      },
    ]);
    await expect(renderer.render(<Emoji code={0x100096} />)).resolves.toEqual([
      {
        type: 'text',
        node: <Emoji code={0x100096} />,
        value: '\u{100096}',
        path: '$',
      },
    ]);
  });
});
