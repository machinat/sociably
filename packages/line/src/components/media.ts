import { unitSegment } from '@machinat/core/renderer';
import { UnitSegment } from '@machinat/core/renderer/types';
import { annotateLineComponent } from '../utils';
import { LineComponent, LineMessageSegmentValue } from '../types';

/**
 * @category Props
 */
type VideoProps = {
  /** URL of video file (Max character limit: 1000) */
  originalContentUrl?: string;
  /**
   * Alias of `originalContentUrl`. Either one of `url` and `originalContentUrl`
   * must be specified.
   */
  url?: string;
  /** URL of preview image (Max character limit: 1000) */
  previewImageUrl?: string;
  /**
   * Alias of `previewImageUrl`. Either one of `url` and `previewImageUrl` must
   * be specified.
   */
  previewURL?: string;
  /**
   * ID used to identify the video when Video viewing complete event occurs. If
   * you send a video message with trackingId added, the video viewing complete
   * event occurs when the user finishes watching the video.
   */
  trackingId?: string;
};

/** @internal */
const __Video = function Video(node, path) {
  const {
    url,
    originalContentUrl,
    previewURL,
    previewImageUrl,
    trackingId,
  } = node.props;

  return [
    unitSegment(node, path, {
      type: 'video' as const,
      originalContentUrl: originalContentUrl || url,
      previewImageUrl: previewImageUrl || previewURL,
      trackingId,
    }),
  ];
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
> = annotateLineComponent(__Video);

/**
 * @category Props
 */
type AudioProps = {
  /** URL of audio file (Max character limit: 1000) */
  originalContentUrl?: string;
  /**
   * Alias of `originalContentUrl`. Either one of `url` and `originalContentUrl`
   * must be specified.
   */
  url?: string;
  /** Length of audio file (milliseconds) */
  duration?: number;
};

/** @internal */
const __Audio = function Audio(node, path) {
  const { url, originalContentUrl, duration } = node.props;
  return [
    unitSegment(node, path, {
      type: 'audio' as const,
      originalContentUrl: originalContentUrl || url,
      duration,
    }),
  ];
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
> = annotateLineComponent(__Audio);
