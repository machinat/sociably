import { unitSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';

const mediaFactory = (name, type) => {
  const container = {
    [name]: (node, path) => {
      const { url, reusable, attachmentId } = node.props;

      return [
        unitSegment(node, path, {
          message: {
            attachment: {
              type,
              payload: {
                url,
                is_reusable: reusable,
                attachment_id: attachmentId,
              },
            },
          },
        }),
      ];
    },
  };

  return annotateMessengerComponent(container[name]);
};

export const Image = mediaFactory('Image', 'image');
export const Video = mediaFactory('Video', 'video');
export const Audio = mediaFactory('Audio', 'audio');
export const File = mediaFactory('File', 'file');
