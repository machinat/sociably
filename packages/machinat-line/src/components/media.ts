import { unitSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const Video = (node, path) => {
  const {
    url,
    originalContentUrl,
    previewURL,
    previewImageUrl,
    trackingId,
  } = node.props;

  return [
    unitSegment(node, path, {
      type: 'video',
      originalContentUrl: originalContentUrl || url,
      previewImageUrl: previewImageUrl || previewURL,
      trackingId,
    }),
  ];
};
annotateLineComponent(Video);

export const Audio = (node, path) => {
  const { url, originalContentUrl, duration } = node.props;
  return [
    unitSegment(node, path, {
      type: 'audio',
      originalContentUrl: originalContentUrl || url,
      duration,
    }),
  ];
};
annotateLineComponent(Audio);
