import { renderQuickReplies, annotateNativeRoot } from './utils';
import { ENTRY_MESSAGES } from './constant';

const nativeMediaFactroy = (name, type) =>
  annotateNativeRoot(
    {
      [name]: (
        { url, quickReplies, metadata, reusable, attachmentId },
        render
      ) => ({
        message: {
          quick_replies:
            quickReplies && renderQuickReplies(quickReplies, render),
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
      }),
    }[name],
    ENTRY_MESSAGES
  );

export const Image = nativeMediaFactroy('Image', 'image');
export const Video = nativeMediaFactroy('Video', 'video');
export const Audio = nativeMediaFactroy('Audio', 'audio');
export const File = nativeMediaFactroy('File', 'file');
