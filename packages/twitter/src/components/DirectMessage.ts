import { MachinatNode } from '@machinat/core';
import { makeUnitSegment, UnitSegment } from '@machinat/core/renderer';
import { formatNode } from '@machinat/core/utils';
import makeTwitterComponent from '../utils/makeTwitterComponent';
import createDmSegmentValue from '../utils/createDmSegmentValue';
import { TwitterSegmentValue, TwitterComponent } from '../types';

/**
 * @category Props
 */
export type DirectMessageProps = {
  /** Texual content of the direct message */
  children?: MachinatNode;
  /** The media attached to the message. Should contain exactly one {@link Photo}, {@link Video} or {@link AnimatedGif} */
  media?: MachinatNode;
  /** The twitter place represent the location. You can search places using [`geo/search API`](https://developer.twitter.com/en/docs/twitter-api/v1/geo/places-near-location/api-reference/get-geo-search) */
  placeId?: string;
  /** The coordinates of the location */
  coordinates?: { latitude: number; longitude: number };
  /** Url buttons to be attached below the messages. Should contain only {@link UrlButton} */
  buttons?: MachinatNode;
  /** Quick replies to be attached after the messages. Should contain only {@link QuickReply} */
  quickReplies?: MachinatNode;
  /** The custome profile to send the messages with */
  customProfileId?: string;
};

/**
 * Send a direct message
 * @category Component
 * @props {@link DirectMessageProps}
 * @guides Check official [guide](https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/message-attachments/guides/attaching-location).
 */
export const DirectMessage: TwitterComponent<
  DirectMessageProps,
  UnitSegment<TwitterSegmentValue>
> = makeTwitterComponent(async function DirectMessage(node, path, render) {
  const {
    children,
    media,
    buttons,
    quickReplies,
    placeId,
    coordinates,
    customProfileId,
  } = node.props;

  if (
    (media && placeId) ||
    (media && coordinates) ||
    (placeId && coordinates)
  ) {
    throw new TypeError(
      'there should be exactly one of "media", "placeId" or "coordinates" prop'
    );
  }

  const [
    contentSegments,
    mediaSegments,
    buttonsSegments,
    quickRepliesSegments,
  ] = await Promise.all([
    render<TwitterSegmentValue>(children, '.children'),
    render<TwitterSegmentValue>(media, '.media'),
    render(buttons, '.buttons'),
    render(quickReplies, '.quickReplies'),
  ]);

  if (!contentSegments && !mediaSegments && !placeId && !coordinates) {
    throw new TypeError(`no text or attachment in <DirectMessage/>`);
  }

  for (const segment of contentSegments || []) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-texual element ${formatNode(
          segment.node
        )} can't be placed under <DirectMessage/>`
      );
    }
  }

  if (
    mediaSegments &&
    (mediaSegments.length > 1 ||
      (mediaSegments[0].type !== 'unit' && mediaSegments[0].type !== 'raw') ||
      mediaSegments[0].value.type !== 'media')
  ) {
    throw new TypeError(
      `"media" prop should contain only 1 "Photo", "Video" or "AnimatedGif"`
    );
  }

  const dmSegmentValue = createDmSegmentValue(
    contentSegments?.[0].value,
    mediaSegments?.[0].value.media
  );

  const messageCreateParams =
    dmSegmentValue.request.parameters.event.message_create;
  if (placeId) {
    messageCreateParams.message_data.attachment = {
      type: 'location',
      location: {
        type: 'shared_place',
        shared_place: {
          place: { id: placeId },
        },
      },
    };
  }
  if (coordinates) {
    messageCreateParams.message_data.attachment = {
      type: 'location',
      location: {
        type: 'shared_coordinate',
        shared_coordinate: {
          coordinates: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      },
    };
  }
  if (customProfileId) {
    messageCreateParams.custom_profile_id = customProfileId;
  }
  if (quickRepliesSegments) {
    messageCreateParams.message_data.quick_reply = {
      type: 'options',
      options: quickRepliesSegments.map(({ value }) => value),
    };
  }
  if (buttonsSegments) {
    messageCreateParams.message_data.ctas = buttonsSegments.map(
      ({ value }) => value
    );
  }

  return [makeUnitSegment(node, path, dmSegmentValue)];
});
