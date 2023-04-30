import { NativeElement } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTwitterComponent from '../utils/makeTwitterComponent';
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
  fileData?: Buffer | NodeJS.ReadableStream;
  /** The content type of the file. Required when uploading using `file` */
  fileType?: string;
  /** The file size in bytes. Required when uploading using `file` */
  fileSize?: number;
};

const makeMediaComponent = (name: string, mediaType: MediaType) =>
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
          fileData,
          fileSize,
          fileType,
          mediaCategory,
          additionalOwners,
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
        if (fileData && (!fileType || !fileSize)) {
          throw new TypeError(
            '"fileType" and "fileSize" props are required when using "fileData" source'
          );
        }

        const params = {
          shared: shared ? 'true' : undefined,
          media_category: mediaCategory,
          additional_owners: additionalOwners
            ? additionalOwners.join(',')
            : undefined,
        };

        return [
          makeUnitSegment(node, path, {
            type: 'media',
            attachment: mediaId
              ? {
                  type: mediaType,
                  source: { type: 'id', id: mediaId, params },
                }
              : url
              ? {
                  type: mediaType,
                  source: { type: 'url', url, params },
                }
              : fileData
              ? {
                  type: mediaType,
                  source: {
                    type: 'file',
                    params: {
                      ...params,
                      total_bytes: fileSize,
                      media_type: fileType,
                    },
                    fileData,
                    assetTag,
                  },
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
