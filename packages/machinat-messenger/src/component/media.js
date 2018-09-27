import { ATTACHED_FILE_DATA, ATTACHED_FILE_INFO } from '../symbol';

import { annotateNativeRoot, renderQuickReplies } from './utils';
import { ENTRY_MESSAGES } from './constant';

const nativeMediaFactroy = (name, type) => {
  const container = {
    [name]: (
      { url, quickReplies, metadata, reusable, attachmentId, data, fileInfo },
      render
    ) => ({
      message: {
        quick_replies: renderQuickReplies(quickReplies, render),
        metadata,
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

  return annotateNativeRoot(container[name], ENTRY_MESSAGES);
};

export const Image = nativeMediaFactroy('Image', 'image');
export const Video = nativeMediaFactroy('Video', 'video');
export const Audio = nativeMediaFactroy('Audio', 'audio');
export const File = nativeMediaFactroy('File', 'file');
