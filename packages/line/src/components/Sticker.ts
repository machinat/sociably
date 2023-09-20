import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import { LineComponent, MessageSegmentValue } from '../types.js';

/** @category Props */
export type StickerProps = {
  /**
   * Package ID for a set of stickers. For information on package IDs, see the
   * [Sticker
   * list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   */
  stickerId: string;
  /**
   * Sticker ID. For a list of sticker IDs for stickers that can be sent with
   * the Messaging API, see the [Sticker
   * list](https://developers.line.biz/media/messaging-api/sticker_list.pdf).
   */
  packageId: string;
};

/**
 * Sticker sends an sticker message.
 *
 * @category Component
 * @props {@link StickerProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#sticker-message).
 */
export const Sticker: LineComponent<
  StickerProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(function Sticker(node, path) {
  const { stickerId, packageId } = node.props;
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'sticker',
        packageId,
        stickerId,
      },
    }),
  ];
});
