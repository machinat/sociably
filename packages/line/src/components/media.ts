import { makeUnitSegment, UnitSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';
import { LineComponent, LineMessageSegmentValue } from '../types';

/**
 * @category Props
 */
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
 * @category Component
 * @props {@link VideoProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#video-message).
 */
export const Video: LineComponent<
  VideoProps,
  UnitSegment<LineMessageSegmentValue>
> = annotateLineComponent(function Video(node, path) {
  const { originalContentUrl, previewImageUrl, trackingId } = node.props;

  return [
    makeUnitSegment(node, path, {
      type: 'video' as const,
      originalContentUrl,
      previewImageUrl,
      trackingId,
    }),
  ];
});

/**
 * @category Props
 */
export type AudioProps = {
  /** URL of audio file (Max character limit: 1000) */
  originalContentUrl: string;
  /** Length of audio file (milliseconds) */
  duration: number;
};

/**
 * Audio sends an audio message.
 * @category Component
 * @props {@link AudioProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#video-message).
 */
export const Audio: LineComponent<
  AudioProps,
  UnitSegment<LineMessageSegmentValue>
> = annotateLineComponent(function Audio(node, path) {
  const { originalContentUrl, duration } = node.props;
  return [
    makeUnitSegment(node, path, {
      type: 'audio' as const,
      originalContentUrl,
      duration,
    }),
  ];
});
