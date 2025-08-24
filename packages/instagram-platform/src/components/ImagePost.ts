import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeInstagramComponent from '../utils/makeInstagramComponent.js';
import { InstagramComponent, PostSegmentValue } from '../types.js';

export type ImagePostProps = {
  /** The URL to the image file */
  url: string;
  /**
   * A caption for the image. Can include hashtags (example: #crazywildebeest)
   * and usernames of Instagram users (example: @natgeo).
   *
   * Mentioned Instagram users receive a notification when the container is
   * published. Maximum 2200 characters, 30 hashtags, and 20 @ tags.
   *
   * Not supported on images in carousels.
   */
  caption?: string;
  /**
   * The ID of a Page associated with a location that you want to tag the image
   * with.
   *
   * Use the [Pages Search
   * API](https://developers.facebook.com/micro_site/url/?click_from_context_menu=true&country=TW&destination=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fpages%2Fsearching&event_type=click&last_nav_impression_id=0P14xS35NFdHjODVp&max_percent_page_viewed=100&max_viewport_height_px=859&max_viewport_width_px=1512&orig_http_referrer=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Finstagram-api%2Freference%2Fig-user%2Fmedia&orig_request_uri=https%3A%2F%2Fdevelopers.facebook.com%2Fajax%2Fpagelet%2Fgeneric.php%2FDeveloperNotificationsPayloadPagelet%3Ffb_dtsg_ag%3D--sanitized--%26data%3D%257B%2522businessUserID%2522%253Anull%252C%2522cursor%2522%253Anull%252C%2522length%2522%253A15%252C%2522clientRequestID%2522%253A%2522js_xp%2522%257D%26__usid%3D6-Ts0vsi64krspa%253APs1w52q117t3d8%253A0-As1w323s9fw4p-RV%253D6%253AF%253D%26jazoest%3D24916&region=apac&scrolled=true&session_id=1dfuyoonWzZNO93Ez&site=developers)
   * to search for Pages whose names match a search string, then parse the
   * results to identify any Pages that have been created for a physical
   * location. Include the location field in your query and verify that the Page
   * you want to use has location data. Attempting to create a container using a
   * Page that has no location data will fail with coded exception
   * INSTAGRAM_PLATFORM_API__INVALID_LOCATION_ID.
   *
   * Not supported on images in carousels.
   */
  locationId?: string;
  /**
   * An array of objects specifying which product tags to tag the image with
   * (maximum of 5; tags and product IDs must be unique). Each object should
   * have the following information
   */
  productTags?: {
    /** The product ID. */
    productId: string;
    /**
     * An optional float that indicates percentage distance from left edge of
     * the published media image. Value must be within 0.0–1.0 range.
     */
    x?: number;
    /**
     * An optional float that indicates percentage distance from top edge of the
     * published media image. Value must be within 0.0–1.0 range.
     */
    y?: number;
  }[];
  /**
   * An array of public usernames and x/y coordinates for any public Instagram
   * users who you want to tag in the image. Each object should have the
   * following information:
   */
  userTags?: {
    /** Public usernames */
    usernames: string[];
    /**
     * An optional float that indicates percentage distance from left edge of
     * the published media image. Value must be within 0.0–1.0 range.
     */
    x?: number;
    /**
     * An optional float that indicates percentage distance from top edge of the
     * published media image. Value must be within 0.0–1.0 range.
     */
    y?: number;
  }[];
};

/**
 * Post a image post to Instagram as the agent.
 *
 * @category Component
 * @props {@link ImagePostProps}
 * @guides Check official API [doc](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
 *   and [reference](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media).
 */
export const ImagePost: InstagramComponent<
  ImagePostProps,
  UnitSegment<PostSegmentValue>
> = makeInstagramComponent(function ImagePost(node, path) {
  const { url, caption, locationId, productTags, userTags } = node.props;

  return [
    makeUnitSegment(node, path, {
      type: 'post',
      params: {
        image_url: url,
        caption,
        location_id: locationId,
        product_tags: productTags,
        user_tags: userTags,
      },
    }),
  ];
});
