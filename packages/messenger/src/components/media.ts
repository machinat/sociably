import { unitSegment } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer/types';
import { annotateMessengerComponent } from '../utils';
import {
  ATTACHMENT_ASSET_TAG,
  ATTACHMENT_DATA,
  ATTACHMENT_INFO,
} from '../constant';
import type { MessageValue, MessengerComponent } from '../types';

/**
 * @category Props
 */
export type MediaProps = {
  /**
   * URL of the file to upload. Max file size is 25MB (after encoding). A
   * Timeout is set to 75 sec for videos and 10 secs for every other file type.
   */
  url: string;
  /**
   * Set to true to make the saved asset sendable to other message recipients.
   * Defaults to false.
   */
  isReusable?: boolean;
  /**
   * Set to true to make the saved asset sendable to other message recipients.
   * Defaults to false.
   */
  attachmentId?: string;

  attachmentAssetTag?: string;
  attachmentFileData?: string | Buffer | ReadableStream;
  attachmentFileInfo?: {
    filename?: string;
    filepath?: string;
    contentType?: string;
    knownLength?: number;
  };
};

/** @internal */
const mediaFactory = (
  name: string,
  type: string
): MessengerComponent<MediaProps, UnitSegment<MessageValue>> => {
  const container = {
    [name]: (node, path) => {
      const {
        url,
        isReusable,
        attachmentId,
        attachmentAssetTag,
        attachmentFileData,
        attachmentFileInfo,
      } = node.props;

      return [
        unitSegment(node, path, {
          message: {
            attachment: {
              type,
              payload: {
                url,
                is_reusable: isReusable,
                attachment_id: attachmentId,
              },
            },
          },
          [ATTACHMENT_ASSET_TAG]: attachmentAssetTag,
          [ATTACHMENT_DATA]: attachmentFileData,
          [ATTACHMENT_INFO]: attachmentFileInfo,
        }),
      ];
    },
  };

  return annotateMessengerComponent(container[name]);
};

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Image = mediaFactory('Image', 'image');

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Video = mediaFactory('Video', 'video');

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const Audio = mediaFactory('Audio', 'audio');

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const File = mediaFactory('File', 'file');
