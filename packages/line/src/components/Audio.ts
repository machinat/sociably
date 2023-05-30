import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import { LineComponent, MessageSegmentValue } from '../types.js';

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
  UnitSegment<MessageSegmentValue>
> = makeLineComponent(function Audio(node, path) {
  const { originalContentUrl, duration } = node.props;
  return [
    makeUnitSegment(node, path, {
      type: 'message',
      params: {
        type: 'audio',
        originalContentUrl,
        duration,
      },
    }),
  ];
});
