import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent';
import { LineComponent, MessageSegmentValue } from '../types';

/**
 * @category Props
 */
export type ImageProps = {
  /** Image URL (Max character limit: 1000) */
  originalContentUrl: string;
  /** Preview image URL (Max character limit: 1000) */
  previewImageUrl: string;
};

/**
 * Image sends an image message.
 * @category Component
 * @props {@link ImageProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#image-message).
 */
export const Image: LineComponent<
  ImageProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(function Image(node, path) {
  const { originalContentUrl, previewImageUrl } = node.props;
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'image',
        originalContentUrl,
        previewImageUrl,
      },
    }),
  ];
});
