import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import { LineComponent, MessageSegmentValue } from '../types.js';

/** @category Props */
export type VideoProps = {
  /** URL of video file (Max character limit: 1000) */
  originalContentUrl: string;
  /** URL of preview image (Max character limit: 1000) */
  previewImageUrl: string;
  /**
   * ID used to identify the video when Video viewing complete event occurs. If
   * you send a video message with trackingId added, the video viewing complete
   * event occurs when the user finishes watching the video.
   */
  trackingId?: string;
};

/**
 * Video sends an video message.
 *
 * @category Component
 * @props {@link VideoProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#video-message).
 */
export const Video: LineComponent<
  VideoProps,
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(function Video(node, path) {
  const { originalContentUrl, previewImageUrl, trackingId } = node.props;

  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'video',
        originalContentUrl,
        previewImageUrl,
        trackingId,
      },
    }),
  ];
});
