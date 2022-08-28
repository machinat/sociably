import { NativeElement, SociablyNode } from '@sociably/core';
import {
  makeUnitSegment,
  UnitSegment,
  InnerRenderFn,
} from '@sociably/core/renderer';
import makeWhatsAppComponent from '../utils/makeWhatsAppComponent';
import { WhatsAppSegmentValue, WhatsAppComponent } from '../types';

/**
 * @category Props
 */
export type MediaProps = {
  /** The uploaded media ID */
  mediaId?: string;
  /** The URL of the media to be sent */
  url?: string;
  /** The file content to be upload */
  fileData?: Buffer | NodeJS.ReadableStream;
  /** The content type of the file. Required when uploading using `file` */
  fileType?: string;
  /** Reply to the specified message */
  replyTo?: string;
  /** The asset tag for saving the created media and reusing it */
  assetTag?: string;
};

export type WithCaption = {
  /** Text to describes the media */
  caption?: SociablyNode;
};

export type WithFileName = {
  /**
   * Describes the filename for the specific document. The extension of the
   * filename will specify what format the document is displayed as in WhatsApp
   */
  fileName?: string;
};

const makeMediaComponent = (componentName: string, mediaType: string) => {
  const container = {
    [componentName]: async (
      node: NativeElement<MediaProps & WithCaption & WithFileName, any>,
      path: string,
      render: InnerRenderFn
    ) => {
      const {
        mediaId,
        url,
        fileData,
        fileType,
        caption,
        fileName,
        replyTo,
        assetTag,
      } = node.props;

      if (
        !(url || mediaId || fileData) ||
        (url && mediaId) ||
        (url && fileData) ||
        (fileData && mediaId)
      ) {
        throw new TypeError(
          'there should be exactly one of "url", "mediaId" or "fileData" prop'
        );
      }
      if (fileData && !fileType) {
        throw new TypeError(
          '"fileType" prop is required when using "fileData" source'
        );
      }

      const captionSegments = await render(caption, '.caption');
      if (captionSegments) {
        for (const seg of captionSegments) {
          if (seg.type !== 'text') {
            throw new TypeError(
              `"caption" prop should contain only textual content`
            );
          }
        }
      }

      return [
        makeUnitSegment(node, path, {
          message: {
            type: mediaType,
            [mediaType]: {
              id: mediaId,
              link: url,
              caption: captionSegments?.[0].value,
              filename: fileName,
            },
            context: replyTo ? { message_id: replyTo } : undefined,
          },
          mediaFile: fileData
            ? {
                data: fileData,
                type: fileType as string,
                info: { contentType: fileType, filename: fileName },
                assetTag,
              }
            : undefined,
        }),
      ];
    },
  };

  return makeWhatsAppComponent(container[componentName]);
};

/**
 * Send an audio
 * @category Component
 * @props {@link AudioProps}
 */
export const Audio: WhatsAppComponent<
  MediaProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeMediaComponent('Audio', 'audio');

/**
 * Send a document
 * @category Component
 * @props {@link DocumentProps}
 */
export const Document: WhatsAppComponent<
  MediaProps & WithCaption & WithFileName,
  UnitSegment<WhatsAppSegmentValue>
> = makeMediaComponent('Document', 'document');

/**
 * Send an image
 * @category Component
 * @props {@link ImageProps}
 */
export const Image: WhatsAppComponent<
  MediaProps & WithCaption,
  UnitSegment<WhatsAppSegmentValue>
> = makeMediaComponent('Image', 'image');

/**
 * Send a sticker
 * @category Component
 * @props {@link StickerProps}
 */
export const Sticker: WhatsAppComponent<
  MediaProps,
  UnitSegment<WhatsAppSegmentValue>
> = makeMediaComponent('Sticker', 'sticker');

/**
 * Send a video
 * @category Component
 * @props {@link VideoProps}
 */
export const Video: WhatsAppComponent<
  MediaProps & WithCaption & WithFileName,
  UnitSegment<WhatsAppSegmentValue>
> = makeMediaComponent('Video', 'video');
