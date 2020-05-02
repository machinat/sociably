import { unitSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const Video = (node, path) => {
  const { url, originalContentUrl, previewURL, previewImageUrl } = node.props;

  return [
    unitSegment(node, path, {
      type: 'image',
      originalContentUrl: originalContentUrl || url,
      previewImageUrl: previewImageUrl || previewURL,
    }),
  ];
};
annotateLineComponent(Video);

export const Audio = (node, path) => {
  const { url, originalContentUrl, duration } = node.props;
  return [
    unitSegment(node, path, {
      type: 'image',
      originalContentUrl: originalContentUrl || url,
      duration,
    }),
  ];
};
annotateLineComponent(Audio);
