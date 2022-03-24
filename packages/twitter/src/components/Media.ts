import { NativeElement } from '@machinat/core';
import { makeUnitSegment, UnitSegment } from '@machinat/core/renderer';
import { makeTwitterComponent } from '../utils';
import { TwitterSegmentValue, TwitterComponent, MediaType } from '../types';

/**
 * @category Props
 */
export type MediaProps = {
  /** Set to true if media asset will be reused for multiple Direct Messages. Default is false */
  shared?: boolean;
  /** The tag to store media asset with */
  assetTag?: string;
  /** A string enum value which identifies a media usecase. This identifier is used to enforce usecase specific constraints (e.g. file size, video duration) and enable advanced features */
  mediaCategory?: string;
  /** A comma-separated list of user IDs to set as additional owners allowed to use the returned media_id in Tweets or Cards. Up to 100 additional owners may be specified */
  additionalOwners?: string[];
  /** The media file url */
  url?: string;
  /** The uploaded media id */
  mediaId?: string;
  /** The file content to be upload */
  file?: Buffer | NodeJS.ReadableStream;
  /** The content type of the file. Required when uploading using `file` */
  fileType?: string;
  /** The file size in bytes. Required when uploading using `file` */
  fileSize?: number;
};

const makeMediaComponent = (name: string, type: MediaType) =>
  makeTwitterComponent(
    {
      [name](
        node: NativeElement<MediaProps, TwitterComponent<MediaProps>>,
        path: string
      ): UnitSegment<TwitterSegmentValue>[] {
        const {
          shared,
          assetTag,
          url,
          mediaId,
          file,
          fileSize,
          fileType,
          mediaCategory,
          additionalOwners,
        } = node.props;

        if (
          !(url || mediaId || file) ||
          (url && mediaId) ||
          (url && file) ||
          (file && mediaId)
        ) {
          throw new TypeError(
            'there should be exactly one of "url", "mediaId" or "file" prop'
          );
        }
        if (file && (!fileType || !fileSize)) {
          throw new TypeError(
            '"fileType" and "fileSize" props are required when using "file" source'
          );
        }

        const parameters = {
          shared: shared ? 'true' : undefined,
          media_category: mediaCategory,
          additional_owners: additionalOwners
            ? additionalOwners.join(',')
            : undefined,
        };

        return [
          makeUnitSegment(node, path, {
            type: 'media',
            media: mediaId
              ? {
                  sourceType: 'id',
                  type,
                  id: mediaId,
                  parameters,
                }
              : url
              ? {
                  sourceType: 'url',
                  type,
                  url,
                  parameters,
                }
              : file
              ? {
                  type,
                  sourceType: 'file',
                  parameters: {
                    ...parameters,
                    total_bytes: String(fileSize),
                    media_type: fileType,
                  },
                  fileData: file,
                  fileInfo: {
                    contentType: fileType,
                    knownLength: fileSize,
                  },
                  assetTag,
                }
              : (null as never),
          }),
        ];
      },
    }[name]
  );

/**
 * Send a photo by direct message or attach it to a tweet
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/overview).
 */
export const Photo: TwitterComponent<
  MediaProps,
  UnitSegment<TwitterSegmentValue>
> = makeMediaComponent('Photo', 'photo');

/**
 * Send a video by direct message or attach it to a tweet
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/overview).
 */
export const Video: TwitterComponent<
  MediaProps,
  UnitSegment<TwitterSegmentValue>
> = makeMediaComponent('Video', 'video');

/**
 * Send an animated gif by direct message or attach it to a tweet
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/overview).
 */
export const AnimatedGif: TwitterComponent<
  MediaProps,
  UnitSegment<TwitterSegmentValue>
> = makeMediaComponent('AnimatedGif', 'animated_gif');
