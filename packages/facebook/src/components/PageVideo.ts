import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import snakecaseKeys from 'snakecase-keys';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import getUnixTimestamp from '../utils/getUnixTimestamp.js';
import { PATH_VIDEOS } from '../constant.js';
import type { FacebookComponent, PageVideoValue } from '../types.js';

export type PageVideoProps = {
  /** Accessible URL of a video file. Cannot be used with upload_phase. */
  url?: string;
  /** Video file data */
  fileData?: Buffer | NodeJS.ReadableStream;
  /** The size of the entire video file in bytes. */
  fileSize?: number;
  /** The video thumbnail raw data to be uploaded and associated with a video. */
  thumbnailData?: Buffer | NodeJS.ReadableStream;
  /** The title of the video. Supports Emoji */
  title?: string;
  /**
   * Time offsets of ad breaks in milliseconds. Ad breaks are short ads that
   * play within a video. Place new ad breaks or delete existing ones.
   */
  adBreaks?: number[];
  /** Everstore handle of wave animation used to burn audio story video */
  audioStoryWaveAnimationHandle?: string;
  /**
   * Settings to allow backdated video post. A backdated post needs to be
   * published.
   */
  backdatedPost?: {
    /** The time when the video post was created. */
    backdatedTime: number | Date;
    /** Accuracy of the backdated time. Default value: none */
    backdatedTimeGranularity?:
      | 'year'
      | 'month'
      | 'day'
      | 'hour'
      | 'min'
      | 'none';
    /** Whether to hide the video from newsfeed display. Default value: false */
    hideFromNewsfeed?: boolean;
  };
  /** Content category of this video. */
  contentCategory?:
    | 'BEAUTY_FASHION'
    | 'BUSINESS'
    | 'CARS_TRUCKS'
    | 'COMEDY'
    | 'CUTE_ANIMALS'
    | 'ENTERTAINMENT'
    | 'FAMILY'
    | 'FOOD_HEALTH'
    | 'HOME'
    | 'LIFESTYLE'
    | 'MUSIC'
    | 'NEWS'
    | 'POLITICS'
    | 'SCIENCE'
    | 'SPORTS'
    | 'TECHNOLOGY'
    | 'VIDEO_GAMING'
    | 'OTHER';
  /**
   * Tags that describe the contents of the video. Use `/search` endpoint with
   * type=adinterest to get possible IDs.
   */
  contentTags?: string[];
  /** The video id that the new video post will be reusing */
  crosspostedVideoId?: string | number;
  /**
   * Labels used to describe the video. Unlike content tags, custom labels are
   * not published and only appear in insights data.
   */
  customLabels?: string[];
  /**
   * The text describing a post that may be shown in a story about it. It may
   * include rich text information, such as entities and emojis. Supports Emoji
   */
  description?: string;
  /** The status to allow sponsor directly boost the post. */
  directShareStatus?: number;
  /** Whether the video is embeddable. */
  embeddable?: boolean;
  /** endOffset */
  endOffset?: number;
  /** Time the video expires and whether it will be removed or hidden. */
  expiration?: {
    time: string;
    type: 'expire_and_delete' | 'expire_only';
  };
  /**
   * Object that controls news feed targeting for this content. Anyone in these
   * demographics will be more likely to see this content, those not will be
   * less likely, but may still see it anyway. Any of the targeting fields
   * shown here can be used, none are required.
   */
  feedTargeting?: {
    geoLocations?: {
      countries?: string[];
      regions?: { key: string }[];
      cities?: { key: string }[];
      zips?: { key: string }[];
    };
    /** Values for targeted locales. Use type of adlocale to find Targeting Options and use the returned key to specify. */
    locales?: string[];
    /** Must be 13 or higher. Default is 0. */
    ageMin?: number;
    /** Maximum age. */
    ageMax?: number;
    /** Target specific genders. 1 targets all male viewers and 2 females. Default is to target both. */
    genders?: number[];
    /** Array of integers. Represent graduation years from college. */
    collegeYears: number[];
    /** Array of integers which represent current educational status. Use 1 for high school, 2 for undergraduate, and 3 for alum (or localized equivalents). */
    educationStatuses: number[];
    /** Array of integers for targeting based on relationship status. Use 1 for single, 2 for 'in a relationship', 3 for married, and 4 for engaged. Default is all types. */
    relationshipStatuses: number[];
    /** One or more IDs of pages to target fans of pages. Use type of page to get possible IDs as find Targeting Options and use the returned id to specify. */
    interests: number[];
  };
  /** Whether the single fisheye video is cropped or not */
  fisheyeVideoCropped?: boolean;
  /** 360 video only: Vertical field of view */
  fov?: number;
  /** The front z rotation in degrees on the single fisheye video */
  frontZRotation?: number;
  /** 360 video only: Guide keyframes data. An array of keyframes, each of which is an array of 3 or 4 elements in the following order: [video timestamp (seconds), pitch (degrees, -90 ~ 90), yaw (degrees, -180 ~ 180), field of view (degrees, 40 ~ 90, optional)], ordered by video timestamp in strictly ascending order. */
  guide?: number[][];
  /** 360 video only: Whether Guide is active. */
  guideEnabled?: boolean;
  /** 360 video only: Horizontal camera perspective to display when the video begins. */
  initialHeading?: number;
  /** 360 video only: Vertical camera perspective to display when the video begins. */
  initialPitch?: number;
  /** is_voice_clip, used to indicate that if a video is used as audio record */
  isVoiceClip?: boolean;
  /** The data of multilingual messages and their dialects */
  multilingualData?: Array<{
    multilingualStatusLang: string;
    /** Supports Emoji */
    multilingualStatus: string;
  }>;
  /** If set to true, this will suppress feed and timeline story. */
  noStory?: boolean;
  /** Original field of view of the source camera */
  originalFov?: number;
  /** 360 video only: The original projection type of the 360 video being uploaded. */
  originalProjectionType?:
    | 'equirectangular'
    | 'cubemap'
    | 'half_equirectangular';
  /** The prompt id in prompts or purple rain that generated this post */
  promptId?: string;
  /** The prompt tracking string associated with this video post */
  promptTrackingString?: string;
  /** Whether a post about this video is published. Non-published videos cannot be backdated. Default value: true */
  published?: boolean;
  /** This metadata is required for clip reacts feature */
  reactModeMetadata?: string;
  /** If set to true, this video will not appear anywhere on Facebook and can not be viewed or shared using permalink. After creating copyright for the video, the video can be used as copyright reference video. Default value is false. */
  referenceOnly?: boolean;
  /** Sticker id of the sticker in the post */
  referencedStickerId?: string | number;
  /** The video id your uploaded video about to replace */
  replaceVideoId?: string | number;
  /** Time when the page post about this video should go live, this should be between 10 mins and 6 months from the time of publishing the video. */
  scheduledPublishTime?: number;
  /** If set to true, this video will not appear anywhere on Facebook and is not searchable. It can be viewed and shared using permalink and embeds. Default value is false. */
  secret?: boolean;
  /** Specification of a list of images that are used to generate video. */
  slideshowSpec?: {
    /** A 3-7 element array of the URLs of the images. Required. */
    imagesUrls: string[];
    /** The duration in milliseconds of each image. Default value is 1000. */
    durationMs?: number;
    /** The duration in milliseconds of the crossfade transition between images. Default value is 1000. */
    transitionMs?: number;
    /** Default value: false */
    reorderingOptIn?: boolean;
    /** Default value: false */
    musicVariationsOptIn?: boolean;
  };
  /** This can be used to enable or prohibit the use of Facebook socialactions (likes, comments, and sharing) on an unlisted video. Default value is false */
  socialActions?: boolean;
  /** source_instagram_media_id */
  sourceInstagramMediaId?: string;
  /** The default dialect of a multilingual post */
  specifiedDialect?: string;
  /** Set if the video was recorded in 360 format. Default value: false */
  spherical?: boolean;
  /** Facebook Page id that is tagged as sponsor in the video post */
  sponsorId?: string | number;
  /** Sponsor Relationship, such as Presented By or Paid PartnershipWith */
  sponsorRelationship?: number;
  /** Start byte position of the file chunk. */
  startOffset?: number;
  /** Type of replacing video request */
  swapMode?: 'replace';
  /** Object that limits the audience for this content. Anyone not in these demographics will not be able to view this content. This will not override any Page-level demographic restrictions that may be in place. */
  targeting?: {
    geoLocations?: {
      countries?: string[];
      regions?: { key: string }[];
      cities?: { key: string }[];
      zips?: { key: string }[];
    };
    locales?: string[];
    excludedCountries?: string[];
    excludedRegions?: number[];
    excludedCities?: number[];
    excludedZipcodes?: string[];
    timezones?: number[];
    ageMin?: 13 | 15 | 18 | 21 | 25;
  };
  /** Properties used in computing transcode settings for the video */
  transcodeSettingProperties?: string;
  /** The publishers asset management code for this video. */
  universalVideoId?: string;
  /** Type of unpublished content, such as scheduled, draft or ads_post. */
  unpublishedContentType?:
    | 'SCHEDULED'
    | 'SCHEDULED_RECURRING'
    | 'DRAFT'
    | 'ADS_POST'
    | 'INLINE_CREATED'
    | 'PUBLISHED'
    | 'REVIEWABLE_BRANDED_CONTENT';
};

/**
 * Publish a video to the page
 * @category Component
 * @props {@link PageVideoProps}
 * @guides Check official [reference](https://developers.facebook.com/docs/graph-api/reference/page/videos/).
 */
export const PageVideo: FacebookComponent<
  PageVideoProps,
  UnitSegment<PageVideoValue>
> = makeFacebookComponent(function PageVideo(node, path) {
  const {
    url,
    fileData,
    fileSize,
    thumbnailData,
    backdatedPost,
    ...restParams
  } = node.props;

  if ((!url && !fileData) || (url && fileData)) {
    throw new TypeError(
      'There should be exactly one source prop: "url" or "fileData"'
    );
  }

  return [
    makeUnitSegment(node, path, {
      type: 'page',
      apiPath: PATH_VIDEOS,
      params: {
        url,
        file_size: fileSize,
        backdated_post: backdatedPost
          ? {
              ...snakecaseKeys(backdatedPost),
              backdated_time: getUnixTimestamp(backdatedPost.backdatedTime),
            }
          : undefined,
        ...snakecaseKeys(restParams, { deep: true }),
      },
      attachFile: fileData ? { data: fileData } : undefined,
      thumbnailFile: thumbnailData ? { data: thumbnailData } : undefined,
    }),
  ];
});
