import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import snakecaseKeys from 'snakecase-keys';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import getUnixTimestamp from '../utils/getUnixTimestamp';
import { PATH_FEED, PATH_PHOTOS } from '../constant';
import type {
  FacebookComponent,
  PagePostValue,
  FacebookSegmentValue,
} from '../types';

type GeoLocation = {
  /** An array of 2-digit ISO 3166 format codes. */
  countries?: string[];
  /** An array of up to 200 regions. Use `/search` with the type `adgeolocation`, and use the returned key. */
  regions?: { key: string }[];
  /** An array of up to 250 cities. Use the method described in the section below with the type adgeolocation, and use the returned key. */
  cities?: { key: string }[];
  /** An array of up to 50,000 zip codes. In the past we limited to 2,500. Zip code searches are covered in our Marketing API documentation and behave the same when used with targeting options for Page feed. The zip field does not work with feed_targeting. */
  zips?: { key: string }[];
  /** An array of neighborhoods. */
  neighborhoods: Record<string, string>;
};

export type PagePostProps = {
  /** The main body of the post. The message can contain mentions of Facebook Pages, @[page-id]. */
  children?: SociablyNode;
  /** Multiple {@link PagePhoto} elements to be attached with the post */
  photos?: SociablyNode;
  /** The URL of a link to attach to the post. */
  link?: string;
  /** Change the displayed link attachment on the post. Must be used with `link`. You might need to verify the link owner first. Check [here](https://developers.facebook.com/docs/graph-api/reference/v15.0/page/feed#custom-image) for more details */
  linkAttachment?: {
    /** The description of the link (appears beneath the link caption). If not specified, this field is automatically populated by information scraped from the link, typically the title of the page. */
    description?: string;
    /** The name of the link attachment. This field is automatically populated by information scraped from the link. */
    name?: string;
    /** URL for the image. Image is sourced from the URL supplied in picture */
    thumbnailUrl?: string;
    /** Image file to be uploaded. Accepts .jpg .jpeg .gif or .png. Image is sourced from the file uploaded in thumbnail */
    thumbnailData?: Buffer | NodeJS.ReadableStream;
  };
  /** Facebook ID for an existing picture in the person's photo albums to use as the thumbnail image. They must be the owner of the photo, and the photo cannot be part of a message attachment. */
  objectAttachment?: string;
  /** The action links attached to the post. */
  actions?: Array<{
    /** The URL of the action link itself. */
    link: string;
    /** The name or label of the action link. */
    name: string;
  }>;
  /** Specifies a time in the past to backdate this post to. */
  backdatedTime?: number | Date;
  /** Controls the display of how a backdated post appears. For example, if you pick month posts will be displayed as 2 months ago instead of an exact date. */
  backdatedTimeGranularity?: 'year' | 'month' | 'day' | 'hour' | 'minute';
  /** Use to specify multiple links in the post. Minimum 2 and maximum of 5 objects. If you set `multiShareOptimized` to true, you can upload a maximum of 10 objects but Facebook will display the top 5. */
  childAttachments?: Array<{
    /** The URL of a link to attach to the post. This field is required. */
    link: string;
    /** Used to show either a price, discount or website domain. If not specified, the content of the linked page will be extracted and used. This field will typically be truncated after 30 characters. */
    description?: string;
    /** Hash of a preview image associated with the link from your ad image library (1:1 aspect ratio and a minimum of 458 x 458 px for best display). Either picture or imageHash must be specified. */
    imageHash?: string;
    /** The title of the link preview. If not specified, the title of the linked page will be used. This field will typically be truncated after 35 characters. It is recommended to set a unique name, as Facebook interfaces show actions reported on the name field. */
    name?: string;
    /** A URL that determines the preview image associated with the link (1:1 aspect ratio and a minimum of 458 x 458 px for best display). Either picture or imageHash must be specified. */
    picture?: string;
  }>;
  /** Object that controls [Feed Targeting](https://www.facebook.com/help/352402648173466) for this content. Anyone in these groups will be more likely to see this content, those not will be less likely, but may still see it anyway. Any of the targeting fields shown here can be used, none are required. */
  feedTargeting?: {
    /** Maximum age. Must be 65 or lower. */
    ageMax?: number;
    /** Must be 13 or higher. Default is 0. */
    ageMin?: number;
    /** Array of integers for graduation year from college. */
    collegeYears?: number[];
    /** Array of integers for targeting based on education level. Use 1 for high school, 2 for undergraduate, and 3 for alum (or localized equivalents). */
    educationStatuses?: number[];
    /** Target specific genders. 1 targets all male viewers and 2 females. Default is to target both. */
    genders?: number[];
    /** This object allows you to specify a number of different geographic locations. Please see our [targeting guide](https://developers.facebook.com/docs/graph-api/reference/v15.0/targeting) for information on this object. */
    geoLocations?: GeoLocation;
    /** One or more IDs to target fans. Use type=audienceinterest to get possible IDs as Targeting Options and use the returned id to specify. */
    interests?: number[];
    /** Targeted locales. Use type of adlocale to find Targeting Options and use the returned key to specify. */
    locales?: number;
    /** Array of integers for targeting based on relationship status. Use 1 for single, 2 for 'in a relationship', 3 for married, and 4 for engaged. Default is all types. */
    relationshipStatuses?: number[];
  };
  /** If set to false, does not display the end card of a carousel link post when childAttachments is used. Default is true. */
  multiShareEndCard?: boolean;
  /** If set to true and only when the post is used in an ad, Facebook will automatically select the order of links in childAttachments. Otherwise, the original ordering of childAttachments is preserved. Default value is true. */
  multiShareOptimized?: boolean;
  /** Page ID of a location associated with this post. */
  place?: string;
  /** Whether a story is shown about this newly published object. Default is true which means the story is displayed in Feed. This field is not supported when actions parameter is specified. Unpublished posts can be used in ads. */
  published?: boolean;
  /** UNIX timestamp indicating when post should go live. Must be date between 10 minutes and 75 days from the time of the API request. */
  scheduledPublishTime?: number | Date;
  /** Comma-separated list of user IDs of people tagged in this post. You cannot specify this field without also specifying a place. */
  tags?: string;
  /** Object that limits the audience for this content. Anyone not in these demographics will not be able to view this content. This will not override any Page-level demographic restrictions that may be in place. */
  targeting?: {
    ageMin?: 13 | 15 | 18 | 21 | 25;
    /** This object allows you to specify a number of different geographic locations. Please see our targeting guide for information on this object. */
    geoLocations?: GeoLocation;
  };
  /** An action, i.e., feeling, watching, etc. */
  ogActionTypeId?: string;
  /** An icon perhaps representing the action type, i.e., a smiley face, a movie icon, etc. */
  ogIconId?: string;
  /** The target of the action, i.e., happy, movie, etc. This can be a predefined object or any page_id. */
  ogObjectId?: string;
  /** Object that specifies a Call to Action button. This should be the action you want people to take when they see your post. Clicking on this button will take people to the link you specify. */
  callToAction?: {
    /** Call to action button type */
    type: string;
    [k: string]: unknown;
  };
};

/**
 * Publish a video to the page
 * @category Component
 * @props {@link PagePostProps}
 * @guides Check official [reference](https://developers.facebook.com/docs/graph-api/reference/page/videos/).
 */
export const PagePost: FacebookComponent<
  PagePostProps,
  UnitSegment<PagePostValue>
> = makeFacebookComponent(async function PagePost(node, path, render) {
  const {
    link,
    children,
    photos,
    linkAttachment,
    objectAttachment,
    scheduledPublishTime,
    backdatedTime,
    ...restParams
  } = node.props;

  const [messageSegments, photosSegments] = await Promise.all([
    render(children, '.children'),
    render<FacebookSegmentValue>(photos, '.photos'),
  ]);

  if (!link && !messageSegments && !photosSegments && !objectAttachment) {
    throw new TypeError(
      'At least one of "link", "message", "photos" or "objectAttachment" prop must be be set'
    );
  }
  if (messageSegments) {
    for (const seg of messageSegments) {
      if (seg.type !== 'text') {
        throw new TypeError(
          '"children" prop should contain only texual content'
        );
      }
    }
  }
  if (photosSegments) {
    for (const seg of photosSegments) {
      if (
        (seg.type !== 'unit' && seg.type !== 'raw') ||
        seg.value.type !== 'page' ||
        seg.value.apiPath !== PATH_PHOTOS
      ) {
        throw new TypeError(
          '"photos" prop should contain only PagePhoto elements'
        );
      }
    }
  }

  return [
    makeUnitSegment(node, path, {
      type: 'page',
      apiPath: PATH_FEED,
      params: {
        ...snakecaseKeys(restParams, { deep: true }),
        link,
        message: messageSegments?.[0].value,
        object_attachment: objectAttachment,
        name: linkAttachment?.name,
        description: linkAttachment?.description,
        picture: linkAttachment?.thumbnailUrl,
        scheduled_publish_time: getUnixTimestamp(scheduledPublishTime),
        backdated_time: getUnixTimestamp(backdatedTime),
      },
      attachFile: linkAttachment?.thumbnailData
        ? { data: linkAttachment.thumbnailData }
        : undefined,
      photos: photosSegments?.map(({ value }) => value),
    }),
  ];
});
