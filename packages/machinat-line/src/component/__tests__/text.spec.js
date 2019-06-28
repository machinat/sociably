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

  it('renders to corespond unicode char', async () => {
    await expect(render(<Emoji code={0x100078} />)).resolves.toEqual([
      {
        type: 'text',
        node: <Emoji code={0x100078} />,
        value: '\u{100078}',
        path: '$',
      },
    ]);
    await expect(render(<Emoji code={0x10008b} />)).resolves.toEqual([
      {
        type: 'text',
        node: <Emoji code={0x10008b} />,
        value: '\u{10008b}',
        path: '$',
      },
    ]);
    await expect(render(<Emoji code={0x100096} />)).resolves.toEqual([
      {
        type: 'text',
        node: <Emoji code={0x100096} />,
        value: '\u{100096}',
        path: '$',
      },
    ]);
  });
});
