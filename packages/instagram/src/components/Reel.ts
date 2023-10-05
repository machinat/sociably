import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeInstagramComponent from '../utils/makeInstagramComponent.js';
import { InstagramComponent, PostSegmentValue } from '../types.js';

export type ReelProps = {
  /** The URL to the video file */
  url: string;
  /**
   * Name of the audio of your Reels media. You can only rename once, either
   * while creating a reel or after from the audio page.
   */
  audioName?: string;
  /**
   * The path to an image to use as the cover image for the Reels tab. We will
   * cURL the image using the URL that you specify so the image must be on a
   * public server. If you specify both coverUrl and thumbOffset, we use
   * coverUrl and ignore thumbOffset. The image must conform to the
   * specifications for a Reels cover photo.
   */
  coverUrl?: string;
  /**
   * The ID of a Page associated with a location that you want to tag the reel
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
   */
  locationId?: string;
  /**
   * When `true`, indicates that the reel can appear in both the Feed and Reels
   * tabs. When `false`, indicates the reel can only appear in the Reels tab.
   */
  shareToFeed?: boolean;
  /**
   * Location, in milliseconds, of the reel video frame to be used as the cover
   * thumbnail image. The default value is 0, which is the first frame of the
   * video or reel. For reels, if you specify both cover_url and thumb_offset,
   * we use cover_url and ignore thumb_offset.
   */
  thumbOffset?: number;
};

/**
 * Post a Reels video to Instagram as the agent.
 *
 * @category Component
 * @props {@link ReelProps}
 * @guides Check official API [doc](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
 *   and [reference](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media).
 */
export const Reel: InstagramComponent<
  ReelProps,
  UnitSegment<PostSegmentValue>
> = makeInstagramComponent(function Reel(node, path) {
  const { url, audioName, coverUrl, locationId, shareToFeed, thumbOffset } =
    node.props;

  return [
    makeUnitSegment(node, path, {
      type: 'post',
      params: {
        media_type: 'REELS',
        video_url: url,
        audio_name: audioName,
        cover_url: coverUrl,
        location_id: locationId,
        share_to_feed: shareToFeed,
        thumb_offset: thumbOffset,
      },
    }),
  ];
});
