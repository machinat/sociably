import { LineSource } from '../types';
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

interface EventObject<
  Type extends string,
  Subtype extends undefined | string = undefined
> {
  type: Type;
  subtype: Subtype;
  payload: LineRawEvent;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-text).
 */
export interface TextMessageEvent
  extends EventObject<'message', 'text'>,
    EventBase,
    Message,
    Repliable,
    Text {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-image).
 */
export interface ImageMessageEvent
  extends EventObject<'message', 'image'>,
    EventBase,
    Message,
    Repliable,
    Media {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-video).
 */
export interface VideoMessageEvent
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
export interface AudioMessageEvent
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
export interface FileMessageEvent
  extends EventObject<'message', 'file'>,
    EventBase,
    Message,
    Repliable,
    File {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-location).
 */
export interface LocationMessageEvent
  extends EventObject<'message', 'location'>,
    EventBase,
    Message,
    Repliable,
    Location {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-sticker).
 */
export interface StickerMessageEvent
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
  extends EventObject<'unsend'>,
    EventBase,
    Message {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#follow-event).
 */
export interface FollowEvent
  extends EventObject<'follow'>,
    EventBase,
    Repliable {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#unfollow-event).
 */
export interface UnfollowEvent extends EventObject<'unfollow'>, EventBase {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#join-event).
 */
export interface JoinEvent extends EventObject<'join'>, EventBase, Repliable {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#leave-event).
 */
export interface LeaveEvent extends EventObject<'leave'>, EventBase {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#member-joined-event).
 */
export interface MemberJoinedEvent
  extends EventObject<'member_joined'>,
    EventBase,
    Repliable,
    Members {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#member-left-event).
 */
export interface MemberLeftEvent
  extends EventObject<'member_left'>,
    EventBase,
    Repliable,
    Members {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-event).
 */
export interface PostbackEvent
  extends EventObject<'postback'>,
    EventBase,
    Repliable,
    Postback {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface DatePostbackEvent
  extends EventObject<'postback', 'date'>,
    EventBase,
    Repliable,
    Postback,
    DateParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface TimePostbackEvent
  extends EventObject<'postback', 'time'>,
    EventBase,
    Repliable,
    Postback,
    TimeParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface DateTimePostbackEvent
  extends EventObject<'postback', 'datetime'>,
    EventBase,
    Repliable,
    Postback,
    DatetimeParam {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#beacon-event).
 */
export interface BeaconEvent
  extends EventObject<'beacon'>,
    EventBase,
    Repliable,
    Beacon {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#account-link-event).
 */
export interface AccountLinkEvent
  extends EventObject<'account_link'>,
    EventBase,
    Repliable,
    AccountLink {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-link-event).
 */
export interface DeviceLinkEvent
  extends EventObject<'things', 'link'>,
    EventBase,
    Repliable,
    DeviceLink {}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-unlink-event).
 */
export interface DeviceUnlinkEvent
  extends EventObject<'things', 'unlink'>,
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

/**
 * @category Event
 */
export interface UnknownEvent extends EventObject<'unknown'>, EventBase {}

export type MessageEvent =
  | TextMessageEvent
  | ImageMessageEvent
  | VideoMessageEvent
  | AudioMessageEvent
  | FileMessageEvent
  | LocationMessageEvent
  | StickerMessageEvent;

export type LineEvent =
  | MessageEvent
  | UnsendEvent
  | FollowEvent
  | UnfollowEvent
  | JoinEvent
  | LeaveEvent
  | MemberJoinedEvent
  | MemberLeftEvent
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
