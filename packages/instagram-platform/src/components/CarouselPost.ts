import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';
import makeInstagramComponent from '../utils/makeInstagramComponent.js';
import { InstagramComponent, PostSegmentValue } from '../types.js';

export type CarouselPostProps = {
  /**
   * A caption for the carousel. Can include hashtags (example:
   * #crazywildebeest) and usernames of Instagram users (example: @natgeo).
   *
   * Mentioned Instagram users receive a notification when the container is
   * published. Maximum 2200 characters, 30 hashtags, and 20 @ tags.
   */
  caption?: string;
  /**
   * An array of up to 10 {@link ImagePost} or {@link VideoPost} of each image and
   * video that should appear in the published carousel. Carousels can have up
   * to 10 total images, vidoes, or a mix of the two.
   */
  children: SociablyNode;
  /**
   * The ID of a Page associated with a location that you want to tag the image
   * or video with.
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
   * Not supported on images or videos in carousels.
   */
  locationId?: string;
};

/**
 * The log out button triggers the account unlinking flow.
 *
 * @category Component
 * @props {@link MediaProps}
 * @guides Check official send API [doc](https://developers.facebook.com/docs/messenger-platform/send-messages)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api).
 */
export const CarouselPost: InstagramComponent<
  CarouselPostProps,
  UnitSegment<PostSegmentValue>
> = makeInstagramComponent(async function CarouselPost(node, path, render) {
  const { caption, children, locationId } = node.props;

  const mediaSegments = await render<PostSegmentValue, never>(children, path);
  if (!mediaSegments?.length) {
    throw new Error(
      `<CarouselPost /> must contain at least one <ImagePost/> or <VideoPost/>`,
    );
  }
  for (const segment of mediaSegments) {
    if (
      (segment.type !== 'unit' && segment.type !== 'raw') ||
      segment.value.type !== 'post' ||
      (segment.value.params.media_type !== undefined &&
        segment.value.params.media_type !== 'VIDEO')
    ) {
      throw new Error(
        `${formatNode(
          segment.node,
        )} is not a valid children of <CarouselPost />, must be <ImagePost/> or <VideoPost/>`,
      );
    }
  }

  return [
    makeUnitSegment(node, path, {
      type: 'post',
      params: {
        media_type: 'CAROUSEL',
        caption,
        location_id: locationId,
        children: mediaSegments.map(
          (segment) => (segment.value as PostSegmentValue).params,
        ),
      },
    }),
  ];
});
