import { MachinatNode } from '@machinat/core/types';
import { makeUnitSegment } from '@machinat/core/renderer';
import type { UnitSegment, FunctionOf } from '@machinat/core/renderer/types';
import { annotateTelegramComponent } from '../utils';
import { TelegramSegmentValue, TelegramComponent } from '../types';
import { MessageProps } from './types';

/**
 * @category Props
 */
export interface LocationProps extends MessageProps {
  /** Latitude of the location */
  latitude: number;
  /** Longitude of the location */
  longitude: number;
  /** Period in seconds for which the location will be updated (see Live Locations, should be between 60 and 86400. */
  livePeriod?: number;
}

const __Location: FunctionOf<TelegramComponent<
  LocationProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Location(node, path, render) {
  const {
    latitude,
    longitude,
    livePeriod,
    disableNotification,
    replyToMessageId,
    replyMarkup,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'sendLocation',
      parameters: {
        latitude,
        longitude,
        live_period: livePeriod,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Send a location point on the map.
 * @category Component
 * @props {@link LocationProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendlocation).
 */
export const Location: TelegramComponent<
  LocationProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Location);

/**
 * @category Props
 */
export interface EditLiveLocationProps {
  /** Required if `inlineMessageId` is not specified. Identifier of the message to edit */
  messageId?: number;
  /** Required if `messageId` are not specified. Identifier of the inline message */
  inlineMessageId?: string;
  /** Latitude of the location */
  latitude: number;
  /** Longitude of the location */
  longitude: number;
  /** One {@link ReplyMarkup} element for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  replyMarkup?: MachinatNode;
}

const __EditLiveLocation: FunctionOf<TelegramComponent<
  EditLiveLocationProps,
  UnitSegment<TelegramSegmentValue>
>> = async function EditLiveLocation(node, path, render) {
  const {
    latitude,
    longitude,
    messageId,
    inlineMessageId,
    replyMarkup,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'editMessageLiveLocation',
      parameters: {
        latitude,
        longitude,
        message_id: messageId,
        inline_message_id: inlineMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Edit a sent live location messages. A location can be edited until its `live_period` expires or editing is explicitly disabled by {@link StopLiveLocation}.
 * @category Component
 * @props {@link EditLiveLocationProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#editmessagelivelocation).
 */
export const EditLiveLocation: TelegramComponent<
  EditLiveLocationProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__EditLiveLocation);

/**
 * @category Props
 */
export interface StopLiveLocationProps {
  /** Required if `inlineMessageId` is not specified. Identifier of the message to edit */
  messageId?: number;
  /** Required if `messageId` are not specified. Identifier of the inline message */
  inlineMessageId?: string;
  /** One {@link ReplyMarkup} element for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  replyMarkup?: MachinatNode;
}

const __StopLiveLocation: FunctionOf<TelegramComponent<
  StopLiveLocationProps,
  UnitSegment<TelegramSegmentValue>
>> = async function StopLiveLocation(node, path, render) {
  const { messageId, inlineMessageId, replyMarkup } = node.props;
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');

  return [
    makeUnitSegment(node, path, {
      method: 'stopMessageLiveLocation',
      parameters: {
        message_id: messageId,
        inline_message_id: inlineMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Stop a sent live location messages. A location can be edited until its `live_period` expires or editing is explicitly disabled by {@link StopLiveLocation}.
 * @category Component
 * @props {@link StopLiveLocationProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#stopmessagelivelocation).
 */
export const StopLiveLocation: TelegramComponent<
  StopLiveLocationProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__StopLiveLocation);

/**
 * @category Props
 */
export interface VenueProps extends MessageProps {
  /** Latitude of the location */
  latitude: number;
  /** Longitude of the location */
  longitude: number;
  /** Name of the venue */
  title: string;
  /** Address of the venue */
  address: string;
  /** Foursquare identifier of the venue */
  foursquareId?: string;
  /** Foursquare type of the venue, if known. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
  foursquareType?: string;
}

const __Venue: FunctionOf<TelegramComponent<
  VenueProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Venue(node, path, render) {
  const {
    latitude,
    longitude,
    title,
    address,
    foursquareId,
    foursquareType,
    disableNotification,
    replyToMessageId,
    replyMarkup,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'sendVenue',
      parameters: {
        latitude,
        longitude,
        title,
        address,
        foursquare_id: foursquareId,
        foursquare_type: foursquareType,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Send a location point on the map.
 * @category Component
 * @props {@link VenueProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendvenue).
 */
export const Venue: TelegramComponent<
  VenueProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Venue);
