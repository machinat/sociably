import { ATTACHED_FILE_DATA, ATTACHED_FILE_INFO } from '../symbol';

import { renderOnlyInTypes, annotateNativeRoot, getRendered } from './utils';
import { ENTRY_MESSAGES } from './constant';
import * as quickRepliesComponents from './quickReply';

const quickReplyTypes = Object.values(quickRepliesComponents);

const nativeMediaFactroy = (name, type) => {
  const container = {
    [name]: (
      { url, quickReplies, metadata, reusable, attachmentId, data, fileInfo },
      render
    ) => {
      const repliesResult = renderOnlyInTypes(
        quickReplyTypes,
        quickReplies,
        render,
        'quickReplies'
      );

      return {
        message: {
          quick_replies: repliesResult && repliesResult.map(getRendered),
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
      };
    },
  };

  return annotateNativeRoot(container[name], ENTRY_MESSAGES);
};

export const Image = nativeMediaFactroy('Image', 'image');
export const Video = nativeMediaFactroy('Video', 'video');
export const Audio = nativeMediaFactroy('Audio', 'audio');
export const File = nativeMediaFactroy('File', 'file');
