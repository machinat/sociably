import type { LineSource } from '../types.js';
import type LineChannel from '../Channel.js';
import type LineUser from '../User.js';
import type LineChat from '../Chat.js';
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
} from './mixins.js';

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

interface EventObject<Category extends string, Type extends string> {
  category: Category;
  type: Type;
  payload: LineRawEvent;
  user: LineUser;
  thread: LineChat;
  channel: LineChannel;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-text).
 */
export interface TextEvent
  extends EventObject<'message', 'text'>,
    EventBase,
    Message,
    Repliable,
    Text {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-image).
 */
export interface ImageEvent
  extends EventObject<'message', 'image'>,
    EventBase,
    Message,
    Repliable,
    Media {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-video).
 */
export interface VideoEvent
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
export interface AudioEvent
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
export interface FileEvent
  extends EventObject<'message', 'file'>,
    EventBase,
    Message,
    Repliable,
    File {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-location).
 */
export interface LocationEvent
  extends EventObject<'message', 'location'>,
    EventBase,
    Message,
    Repliable,
    Location {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-sticker).
 */
export interface StickerEvent
  extends EventObject<'message', 'sticker'>,
    EventBase,
    Message,
    Repliable,
    Sticker {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#unsend-event).
 */
export interface UnsendEvent
  extends EventObject<'action', 'unsend'>,
    EventBase,
    Message {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#follow-event).
 */
export interface FollowEvent
  extends EventObject<'action', 'follow'>,
    EventBase,
    Repliable {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#unfollow-event).
 */
export interface UnfollowEvent
  extends EventObject<'action', 'unfollow'>,
    EventBase {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#join-event).
 */
export interface JoinEvent
  extends EventObject<'action', 'join'>,
    EventBase,
    Repliable {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#leave-event).
 */
export interface LeaveEvent extends EventObject<'action', 'leave'>, EventBase {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#member-joined-event).
 */
export interface MemberJoinEvent
  extends EventObject<'action', 'member_join'>,
    EventBase,
    Repliable,
    Members {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#member-left-event).
 */
export interface MemberLeaveEvent
  extends EventObject<'action', 'member_leave'>,
    EventBase,
    Repliable,
    Members {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-event).
 */
export interface PostbackEvent
  extends EventObject<'callback', 'postback'>,
    EventBase,
    Repliable,
    Postback {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface DatePostbackEvent
  extends EventObject<'callback', 'date_postback'>,
    EventBase,
    Repliable,
    Postback,
    DateParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface TimePostbackEvent
  extends EventObject<'callback', 'time_postback'>,
    EventBase,
    Repliable,
    Postback,
    TimeParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface DateTimePostbackEvent
  extends EventObject<'callback', 'datetime_postback'>,
    EventBase,
    Repliable,
    Postback,
    DatetimeParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#beacon-event).
 */
export interface BeaconEvent
  extends EventObject<'beacon', 'beacon'>,
    EventBase,
    Repliable,
    Beacon {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#account-link-event).
 */
export interface AccountLinkEvent
  extends EventObject<'action', 'account_link'>,
    EventBase,
    Repliable,
    AccountLink {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-link-event).
 */
export interface DeviceLinkEvent
  extends EventObject<'things', 'device_link'>,
    EventBase,
    Repliable,
    DeviceLink {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-unlink-event).
 */
export interface DeviceUnlinkEvent
  extends EventObject<'things', 'device_unlink'>,
    EventBase,
    Repliable,
    DeviceLink {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-unlink-event).
 */
export interface ThingsScenarioExecutionEvent
  extends EventObject<'things', 'scenario_result'>,
    EventBase,
    Repliable,
    DeviceLink,
    ThingsScenarioExecution {}

/** @category Event */
export interface UnknownEvent
  extends EventObject<'unknown', 'unknown'>,
    EventBase {}

/** @category Event */
export type LineMessageEvent =
  | TextEvent
  | ImageEvent
  | VideoEvent
  | AudioEvent
  | FileEvent
  | LocationEvent
  | StickerEvent;

/** @category Event */
export type LineEvent =
  | LineMessageEvent
  | UnsendEvent
  | FollowEvent
  | UnfollowEvent
  | JoinEvent
  | LeaveEvent
  | MemberJoinEvent
  | MemberLeaveEvent
  | PostbackEvent
  | TimePostbackEvent
  | DatePostbackEvent
  | DateTimePostbackEvent
  | BeaconEvent
  | AccountLinkEvent
  | DeviceLinkEvent
  | DeviceUnlinkEvent
  | ThingsScenarioExecutionEvent
  | UnknownEvent;
