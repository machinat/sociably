/* eslint-disable import/prefer-default-export */
import { makePartSegment, PartSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';
import { LineComponent } from '../types';

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

const __Emoji = function Emoji(node, path) {
  const { productId, emojiId } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'emoji_placeholder',
      productId,
      emojiId,
    }),
  ];
};

/**
 * Insert a LINE emoji within a {@link Expression} element.
 * @category Component
 * @props {@link EmojiProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#text-message).
 */
export const Emoji: LineComponent<
  EmojiProps,
  PartSegment<any>
> = annotateLineComponent(__Emoji);
