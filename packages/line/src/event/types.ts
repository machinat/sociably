import { LineSource } from '../types';
import LineUser from '../user';
import LineChat from '../channel';
import {
  EventBase,
  Message,
  Repliable,
  Text,
  Media,
  Playable,
  File,
  Location,
  Sticker,
  Members,
  Postback,
  DateParam,
  TimeParam,
  DatetimeParam,
  Beacon,
  AccountLink,
  DeviceLink,
  ThingsScenarioExecution,
} from './mixins';

// TODO: complete type of the raw event
export type LineRawEvent = {
  type: string;
  timestamp: number;
  source: LineSource;
  replyToken: string;
  message: any;
  joined: any;
  left: any;
  postback: any;
  beacon: any;
  link: any;
  things: any;
};

interface EventObject<Kind extends string, Type extends string> {
  kind: Kind;
  type: Type;
  payload: LineRawEvent;
  user: LineUser;
  channel: LineChat;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-text).
 */
export interface LineTextEvent
  extends EventObject<'message', 'text'>,
    EventBase,
    Message,
    Repliable,
    Text {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-image).
 */
export interface LineImageEvent
  extends EventObject<'message', 'image'>,
    EventBase,
    Message,
    Repliable,
    Media {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-video).
 */
export interface LineVideoEvent
  extends EventObject<'message', 'video'>,
    EventBase,
    Message,
    Repliable,
    Media,
    Playable {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-audio).
 */
export interface LineAudioEvent
  extends EventObject<'message', 'audio'>,
    EventBase,
    Message,
    Repliable,
    Media,
    Playable {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-file).
 */
export interface LineFileEvent
  extends EventObject<'message', 'file'>,
    EventBase,
    Message,
    Repliable,
    File {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-location).
 */
export interface LineLocationEvent
  extends EventObject<'message', 'location'>,
    EventBase,
    Message,
    Repliable,
    Location {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-sticker).
 */
export interface LineStickerEvent
  extends EventObject<'message', 'sticker'>,
    EventBase,
    Message,
    Repliable,
    Sticker {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#unsend-event).
 */
export interface LineUnsendEvent
  extends EventObject<'action', 'unsend'>,
    EventBase,
    Message {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#follow-event).
 */
export interface LineFollowEvent
  extends EventObject<'action', 'follow'>,
    EventBase,
    Repliable {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#unfollow-event).
 */
export interface LineUnfollowEvent
  extends EventObject<'action', 'unfollow'>,
    EventBase {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#join-event).
 */
export interface LineJoinEvent
  extends EventObject<'action', 'join'>,
    EventBase,
    Repliable {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#leave-event).
 */
export interface LineLeaveEvent
  extends EventObject<'action', 'leave'>,
    EventBase {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#member-joined-event).
 */
export interface LineMemberJoinEvent
  extends EventObject<'action', 'member_join'>,
    EventBase,
    Repliable,
    Members {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#member-left-event).
 */
export interface LineMemberLeaveEvent
  extends EventObject<'action', 'member_leave'>,
    EventBase,
    Repliable,
    Members {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-event).
 */
export interface LinePostbackEvent
  extends EventObject<'postback', 'postback'>,
    EventBase,
    Repliable,
    Postback {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface LineDatePostbackEvent
  extends EventObject<'postback', 'date_postback'>,
    EventBase,
    Repliable,
    Postback,
    DateParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface LineTimePostbackEvent
  extends EventObject<'postback', 'time_postback'>,
    EventBase,
    Repliable,
    Postback,
    TimeParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface LineDateTimePostbackEvent
  extends EventObject<'postback', 'datetime_postback'>,
    EventBase,
    Repliable,
    Postback,
    DatetimeParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#beacon-event).
 */
export interface LineBeaconEvent
  extends EventObject<'beacon', 'beacon'>,
    EventBase,
    Repliable,
    Beacon {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#account-link-event).
 */
export interface LineAccountLinkEvent
  extends EventObject<'action', 'account_link'>,
    EventBase,
    Repliable,
    AccountLink {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-link-event).
 */
export interface LineDeviceLinkEvent
  extends EventObject<'things', 'device_link'>,
    EventBase,
    Repliable,
    DeviceLink {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-unlink-event).
 */
export interface LineDeviceUnlinkEvent
  extends EventObject<'things', 'device_unlink'>,
    EventBase,
    Repliable,
    DeviceLink {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-unlink-event).
 */
export interface LineThingsScenarioExecutionEvent
  extends EventObject<'things', 'scenario_result'>,
    EventBase,
    Repliable,
    DeviceLink,
    ThingsScenarioExecution {}

/**
 * @category Event
 */
export interface LineUnknownEvent
  extends EventObject<'unknown', 'unknown'>,
    EventBase {}

export type LineMessageEvent =
  | LineTextEvent
  | LineImageEvent
  | LineVideoEvent
  | LineAudioEvent
  | LineFileEvent
  | LineLocationEvent
  | LineStickerEvent;

export type LineEvent =
  | LineMessageEvent
  | LineUnsendEvent
  | LineFollowEvent
  | LineUnfollowEvent
  | LineJoinEvent
  | LineLeaveEvent
  | LineMemberJoinEvent
  | LineMemberLeaveEvent
  | LinePostbackEvent
  | LineTimePostbackEvent
  | LineDatePostbackEvent
  | LineDateTimePostbackEvent
  | LineBeaconEvent
  | LineAccountLinkEvent
  | LineDeviceLinkEvent
  | LineDeviceUnlinkEvent
  | LineThingsScenarioExecutionEvent
  | LineUnknownEvent;
