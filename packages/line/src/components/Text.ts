import { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import {
  makePartSegment,
  makeUnitSegment,
  UnitSegment,
  PartSegment,
} from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent';
import { LineComponent, MessageSegmentValue } from '../types';

const EMOJI_PLACEHOLDER_TYPE = 'emoji_placeholder';

type EmojiValue = {
  index: number;
  productId: string;
  emojiId: string;
};

type EmojiPlaceHolder = {
  type: typeof EMOJI_PLACEHOLDER_TYPE;
  productId: string;
  emojiId: string;
};

/**
 * @category Props
 */
export type EmojiProps = {
  /**
   * Product ID for a set of LINE emoji. See Sendable
   * [LINE emoji list](https://d.line-scdn.net/r/devcenter/sendable_line_emoji_list.pdf).
   */
  productId: string;
  /**
   * ID for a LINE emoji inside a set. See Sendable
   * [LINE emoji list](https://d.line-scdn.net/r/devcenter/sendable_line_emoji_list.pdf).
   */
  emojiId: string;
};

/**
 * Insert a LINE emoji within a {@link Text} element.
 * @category Component
 * @props {@link EmojiProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#text-message).
 */
export const Emoji: LineComponent<
  EmojiProps,
  PartSegment<{}>
> = makeLineComponent(function Emoji(node, path) {
  const { productId, emojiId } = node.props;
  return [
    makePartSegment(node, path, {
      type: EMOJI_PLACEHOLDER_TYPE,
      productId,
      emojiId,
    }),
  ];
});

/**
 * @category Props
 */
export type TextProps = {
  /** The text content which may contains `Emoji` element inside */
  children: SociablyNode;
};

/**
 * Insert a LINE emoji within a {@link Text} element.
 * @category Component
 * @props {@link EmojiProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#text-message).
 */
export const Text: LineComponent<
  TextProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(async function Text(node, path, render) {
  const childrenSegments = await render<unknown, EmojiPlaceHolder>(
    node.props.children,
    '.children'
  );
  if (!childrenSegments) {
    return null;
  }

  let text = '';
  const emojis: EmojiValue[] = [];

  for (const seg of childrenSegments) {
    if (seg.type === 'text') {
      text += seg.value;
    } else if (
      seg.type === 'part' &&
      seg.value.type === EMOJI_PLACEHOLDER_TYPE
    ) {
      const { productId, emojiId } = seg.value;
      emojis.push({
        index: text.length,
        productId,
        emojiId,
      });
      text += '$';
    } else {
      throw new TypeError(
        `${formatNode(
          seg.node
        )} can't be placed in <Text/>, only textual node and <Emoji/> allowed`
      );
    }
  }

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'text',
        text,
        emojis: emojis.length > 0 ? emojis : undefined,
      },
    }),
  ];
});
