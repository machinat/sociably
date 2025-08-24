import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import snakecaseKeys from 'snakecase-keys';
import { MetaApiUploadingFile } from '@sociably/meta-api';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import getUnixTimestamp from '../utils/getUnixTimestamp.js';
import { PATH_PHOTOS } from '../constant.js';
import type { FacebookComponent, PostPhotoValue } from '../types.js';

export type PostPhotoProps = {
  /**
   * The URL of a photo that is already uploaded to the Internet. You must
   * specify this or a file attachment
   */
  url?: string;
  /** Upload a photo file. Supported formats: JPEG, BMP, PNG, GIF, TIFF */
  file?: MetaApiUploadingFile;
  /**
   * A vault image ID to use for a photo. You can use only one of url, a file
   * attachment, vault_image_id
   */
  vaultImageId?: string | number;
  /**
   * Indicates that we should allow this photo to be treated as a spherical
   * photo. This will not change the behavior unless the server is able to
   * interpret the photo as spherical, such as via Photosphere XMP metadata.
   * Regular non-spherical photos will still be treated as regular photos even
   * if this parameter is true. Default value: false
   */
  allowSphericalPhoto?: boolean;
  /** Accessible alternative description for an image */
  altTextCustom?: string;
  /** Android key hash */
  androidKeyHash?: string;
  /** ITunes App ID. This is used by the native Share dialog that's part of iOS */
  applicationId?: string;
  /**
   * Number of attempts that have been made to upload this photo. Default value:
   * 0
   */
  attempt?: number;
  /** Audience exp. Default value: false */
  audienceExp?: boolean;
  /** A user-specified creation time for this photo */
  backdatedTime?: number | Date;
  /**
   * Use only the part of the backdated_time parameter to the specified
   * granularity. Default value: none
   */
  backdatedTimeGranularity?: 'year' | 'month' | 'day' | 'hour' | 'min' | 'none';
  /** The description of the photo. Supports Emoji */
  caption?: string;
  /** Composer session ID */
  composerSessionId?: string;
  /** The status to allow sponsor directly boost the post. */
  directShareStatus?: number;
  /**
   * Object that controls News Feed targeting for this post. Anyone in these
   * groups will be more likely to see this post. People not in these groups
   * will be less likely to see this post, but may still see it anyway. Any of
   * the targeting fields shown here can be used, but none are required.
   */
  feedTargeting?: {
    /**
     * Values for targeted locales. Use type of adlocale to find Targeting
     * Options and use the returned key to specify.
     */
    locales?: string[];
    /** Must be 13 or higher. Default is 0. */
    ageMin?: number;
    /** Maximum age. */
    ageMax?: number;
    /**
     * Target specific genders. 1 targets all male viewers and 2 females.
     * Default is to target both.
     */
    genders?: number[];
    /** Array of integers. Represent graduation years from college. */
    collegeYears?: number[];
    /**
     * Array of integers which represent current educational status. Use 1 for
     * high school, 2 for undergraduate, and 3 for alum (or localized
     * equivalents).
     */
    educationStatuses?: number[];
    /**
     * Array of integers for targeting based on relationship status. Use 1 for
     * single, 2 for 'in a relationship', 3 for married, and 4 for engaged.
     * Default is all types.
     */
    relationshipStatuses?: number[];
    /**
     * One or more IDs of pages to target fans of pages.Use type of page to get
     * possible IDs as find Targeting Options and use the returned id to
     * specify.
     */
    interests?: number[];
  };
  /** Unused? Default value: -1 */
  filterType?: number;
  /** Full res is coming later. Default value: false */
  fullResIsComingLater?: boolean;
  /**
   * Manually specify the initial view heading in degrees from 0 to 360. This
   * overrides any value present in the photo embedded metadata or provided in
   * the spherical_metadata parameter
   */
  initialViewHeadingOverrideDegrees?: number;
  /**
   * Manually specify the initial view pitch in degrees from -90 to 90. This
   * overrides any value present in the photo embedded metadata or provided in
   * the spherical_metadata parameter
   */
  initialViewPitchOverrideDegrees?: number;
  /**
   * Manually specify the initial view vertical FOV in degrees from 60 to 120.
   * This overrides any value present in the photo embedded metadata or provided
   * in the spherical_metadata parameter
   */
  initialViewVerticalFovOverrideDegrees?: number;
  /** IOS Bundle ID */
  iosBundleId?: string;
  /** Is this an explicit location? */
  isExplicitLocation?: boolean;
  /** If set to true, the tag is a place, not a person */
  isExplicitPlace?: boolean;
  /** Manual privacy. Default value: false */
  manualPrivacy?: boolean;
  /**
   * If set to true, this will suppress the News Feed story that is
   * automatically generated on a profile when people upload a photo using your
   * app. Useful for adding old photos where you may not want to generate a
   * story
   */
  noStory?: boolean;
  /** Offline ID. Default value: 0 */
  offlineId?: number;
  /** The Open Graph action type */
  ogActionTypeId?: string | number;
  /** The Open Graph icon */
  ogIconId?: string | number;
  /** The Open Graph object ID */
  ogObjectId?: string;
  /** The Open Graph phrase */
  ogPhrase?: string;
  /** Flag to set if the post should create a profile badge. Default value: false */
  ogSetProfileBadge?: boolean;
  /** The Open Graph suggestion */
  ogSuggestionMechanism?: string;
  /** Page ID of a place associated with the photo */
  place?: string;
  /**
   * Determines the privacy settings of the photo. If not supplied, this
   * defaults to the privacy level granted to the app in the Login dialog. This
   * field cannot be used to set a more open privacy setting than the one
   * granted
   */
  privacy?: string;
  /** Proxied app ID */
  proxiedAppId?: string | number;
  /**
   * Set to false if you don't want the photo to be published immediately.
   * Default value: true
   */
  published?: boolean;
  /** Photos waterfall ID */
  qn?: string;
  /**
   * Time at which an unpublished post should be published (Unix ISO-8601
   * format). Applies to Pages only
   */
  scheduledPublishTime?: number;
  /**
   * A set of params describing an uploaded spherical photo. This field is not
   * required; if it is not present we will try to generate spherical metadata
   * from the metadata embedded in the image. If it is present, it takes
   * precedence over any embedded metadata. See also the Google Photo Sphere
   * spec for more info on the meaning of the params:
   * https://developers.google.com/streetview/spherical-metadata
   */
  sphericalMetadata?: Record<string, string | number>;
  /** Facebook Page id that is tagged as sponsor in the photo post */
  sponsorId?: string | number;
  /** Sponsor Relationship, such as Presented By or Paid PartnershipWith */
  sponsorRelationship?: number;
  /** Tags on this photo */
  tags?: {
    /** The x-axis offset for the tag */
    x: number;
    /** The y-axis offset for the tag */
    y: number;
    /** The user_id of the tagged person */
    tagUid: number;
    /** Text associated with the tag */
    tagText: string;
  }[];
  /** Allows you to target posts to specific audiences. Applies to Pages only */
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
  /** Same as backdated_time but with a time delta instead of absolute time */
  timeSinceOriginalPost?: number;
  /** Content type of the unpublished content type */
  unpublishedContentType?:
    | 'SCHEDULED'
    | 'SCHEDULED_RECURRING'
    | 'DRAFT'
    | 'ADS_POST'
    | 'INLINE_CREATED'
    | 'PUBLISHED'
    | 'REVIEWABLE_BRANDED_CONTENT';
  /** User selected tags. Default value: false */
  userSelectedTags?: boolean;
};

/**
 * Publish a photo to the page
 *
 * @category Component
 * @props {@link PostPhotoProps}
 * @guides Check official [reference](https://developers.facebook.com/docs/graph-api/reference/photo/).
 */
export const PostPhoto: FacebookComponent<
  PostPhotoProps,
  UnitSegment<PostPhotoValue>
> = makeFacebookComponent(function PostPhoto(node, path) {
  const {
    url,
    file,
    vaultImageId,
    sphericalMetadata,
    backdatedTime,
    ...restParams
  } = node.props;

  if (
    (!url && !file && !vaultImageId) ||
    (url && file) ||
    (file && vaultImageId) ||
    (url && vaultImageId)
  ) {
    throw new TypeError(
      'There should be exactly one source prop: "url", "file" or "vaultImageId"',
    );
  }

  return [
    makeUnitSegment(node, path, {
      type: 'post',
      apiPath: PATH_PHOTOS,
      params: {
        url,
        vault_image_id: vaultImageId,
        // NOTE: spherical_metadata is in Pascal case. Keep it original
        spherical_metadata: sphericalMetadata,
        backdated_time: getUnixTimestamp(backdatedTime),
        ...snakecaseKeys(restParams, { deep: true }),
      },
      file,
    }),
  ];
});
