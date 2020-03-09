import { asUnitComponent } from '../utils';
import { ATTACHMENT_DATA, ATTACHMENT_INFO, ASSET_TAG } from '../constant';

const nativeMediaFactory = (name, type) => {
  const container = {
    [name]: async ({
      url,
      reusable,
      attachmentId,
      assetTag,
      fileData,
      fileInfo,
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
      [ASSET_TAG]: assetTag,
      [ATTACHMENT_DATA]: fileData,
      [ATTACHMENT_INFO]: fileInfo,
    }),
  };

  return asUnitComponent(container[name]);
};

export const Image = nativeMediaFactory('Image', 'image');
export const Video = nativeMediaFactory('Video', 'video');
export const Audio = nativeMediaFactory('Audio', 'audio');
export const File = nativeMediaFactory('File', 'file');
