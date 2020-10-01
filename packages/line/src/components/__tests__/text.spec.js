import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import { Emoji } from '../text';
import { renderInner } from './utils';

describe('Emoji', () => {
  it('is valid native unit component', () => {
    expect(typeof Emoji).toBe('function');

    expect(isNativeType(<Emoji />)).toBe(true);
    expect(Emoji.$$platform).toBe('line');
  });

  it('renders to corespond unicode char', async () => {
    await expect(renderInner(<Emoji productId="foo" emojiId="bar" />)).resolves
      .toMatchInlineSnapshot(`
      Array [
        Object {
          "node": <Emoji
            emojiId="bar"
            productId="foo"
          />,
          "path": "$#container",
          "type": "part",
          "value": Object {
            "emojiId": "bar",
            "productId": "foo",
            "type": "emoji_placeholder",
          },
        },
      ]
    `);
  });
});
