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

type WithPayload = {
  payload: LineRawEvent;
};

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-text).
 */
export interface TextMessageEvent
  extends WithPayload,
    EventBase,
    Message,
    Repliable,
    Text {
  type: 'message';
  subtype: 'text';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-image).
 */
export interface ImageMessageEvent
  extends WithPayload,
    EventBase,
    Message,
    Repliable,
    Media {
  type: 'message';
  subtype: 'image';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-video).
 */
export interface VideoMessageEvent
  extends WithPayload,
    EventBase,
    Message,
    Repliable,
    Media,
    Playable {
  type: 'message';
  subtype: 'video';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-audio).
 */
export interface AudioMessageEvent
  extends WithPayload,
    EventBase,
    Message,
    Repliable,
    Media,
    Playable {
  type: 'message';
  subtype: 'audio';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-file).
 */
export interface FileMessageEvent
  extends WithPayload,
    EventBase,
    Message,
    Repliable,
    File {
  type: 'message';
  subtype: 'file';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-location).
 */
export interface LocationMessageEvent
  extends WithPayload,
    EventBase,
    Message,
    Repliable,
    Location {
  type: 'message';
  subtype: 'location';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#wh-sticker).
 */
export interface StickerMessageEvent
  extends WithPayload,
    EventBase,
    Message,
    Repliable,
    Sticker {
  type: 'message';
  subtype: 'sticker';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#unsend-event).
 */
export interface UnsendEvent extends WithPayload, EventBase, Message {
  type: 'unsend';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#follow-event).
 */
export interface FollowEvent extends WithPayload, EventBase, Repliable {
  type: 'follow';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#unfollow-event).
 */
export interface UnfollowEvent extends WithPayload, EventBase {
  type: 'unfollow';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#join-event).
 */
export interface JoinEvent extends WithPayload, EventBase, Repliable {
  type: 'join';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#leave-event).
 */
export interface LeaveEvent extends WithPayload, EventBase {
  type: 'leave';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#member-joined-event).
 */
export interface MemberJoinedEvent
  extends WithPayload,
    EventBase,
    Repliable,
    Members {
  type: 'member_joined';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#member-left-event).
 */
export interface MemberLeftEvent
  extends WithPayload,
    EventBase,
    Repliable,
    Members {
  type: 'member_left';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-event).
 */
export interface PostbackEvent
  extends WithPayload,
    EventBase,
    Repliable,
    Postback {
  type: 'postback';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface DatePostbackEvent
  extends WithPayload,
    EventBase,
    Repliable,
    Postback,
    DateParam {
  type: 'postback';
  subtype: 'date';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface TimePostbackEvent
  extends WithPayload,
    EventBase,
    Repliable,
    Postback,
    TimeParam {
  type: 'postback';
  subtype: 'time';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-params-object).
 */
export interface DateTimePostbackEvent
  extends WithPayload,
    EventBase,
    Repliable,
    Postback,
    DatetimeParam {
  type: 'postback';
  subtype: 'datetime';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#beacon-event).
 */
export interface BeaconEvent extends WithPayload, EventBase, Repliable, Beacon {
  type: 'beacon';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#account-link-event).
 */
export interface AccountLinkEvent
  extends WithPayload,
    EventBase,
    Repliable,
    AccountLink {
  type: 'account_link';
  subtype: undefined;
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-link-event).
 */
export interface DeviceLinkEvent
  extends WithPayload,
    EventBase,
    Repliable,
    DeviceLink {
  type: 'things';
  subtype: 'link';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-unlink-event).
 */
export interface DeviceUnlinkEvent
  extends WithPayload,
    EventBase,
    Repliable,
    DeviceLink {
  type: 'things';
  subtype: 'unlink';
}

/**
 * @category Event
 * @guide Check official [reference](https://developers.line.biz/en/reference/messaging-api/#device-unlink-event).
 */
export interface ThingsScenarioExecutionEvent
  extends WithPayload,
    EventBase,
    Repliable,
    DeviceLink,
    ThingsScenarioExecution {
  type: 'things';
  subtype: 'scenario_result';
}

/**
 * @category Event
 */
export interface UnknownEvent extends WithPayload, EventBase {
  type: 'unknown';
  subtype: undefined;
}

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
