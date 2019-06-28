import { asSingleMessageUnitComponent } from './utils';
import { ATTACHED_FILE_DATA, ATTACHED_FILE_INFO } from '../constant';

const nativeMediaFactroy = (name, type) => {
  const container = {
    [name]: async ({
      props: { url, reusable, attachmentId, data, fileInfo },
    }) => ({
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
      [ATTACHED_FILE_DATA]: data,
      [ATTACHED_FILE_INFO]: fileInfo,
    }),
  };

  return asSingleMessageUnitComponent(container[name]);
};

export const Image = nativeMediaFactroy('Image', 'image');
export const Video = nativeMediaFactroy('Video', 'video');
export const Audio = nativeMediaFactroy('Audio', 'audio');
export const File = nativeMediaFactroy('File', 'file');
