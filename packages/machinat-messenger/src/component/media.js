import { asUnitComponent } from '../utils';
import { ATTACHMENT_DATA, ATTACHMENT_INFO, ASSET_TAG } from '../constant';

const nativeMediaFactroy = (name, type) => {
  const container = {
    [name]: async ({
      props: { url, reusable, attachmentId, assetTag, fileData, fileInfo },
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

export const Image = nativeMediaFactroy('Image', 'image');
export const Video = nativeMediaFactroy('Video', 'video');
export const Audio = nativeMediaFactroy('Audio', 'audio');
export const File = nativeMediaFactroy('File', 'file');
