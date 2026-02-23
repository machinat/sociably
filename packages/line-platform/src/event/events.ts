/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mixin from '@sociably/core/utils/mixin.js';
import LineChannel from '../Channel.js';
import LineUser from '../User.js';
import LineChat from '../Chat.js';
import type {
  UserSource,
  LineRawEvent,
  LineRawTextMessage,
  LineRawAudioMessage,
  LineRawMediaMessage,
  LineRawVideoMessage,
  LineRawFileMessage,
  LineRawLocationMessage,
  LineRawStickerMessage,
  LineRawPostbackData,
} from '../types.js';

const LINE = 'line' as const;

class EventBase {
  platform = LINE;

  constructor(
    public payload: LineRawEvent,
    public providerId: string,
    public channelId: string,
  ) {}

  get agent(): LineChannel {
    return new LineChannel(this.channelId);
  }

  get thread(): LineChat | null {
    return this.payload.source
      ? LineChat.fromMessagingSource(this.channelId, this.payload.source)
      : null;
  }

  get user(): LineUser | null {
    return this.payload.source?.userId
      ? new LineUser(this.providerId, this.payload.source.userId)
      : null;
  }

  /** Event timestamp in milliseconds. */
  get time(): Date {
    return new Date(this.payload.timestamp);
  }

  readonly [Symbol.toStringTag] = 'LineEvent';
}

class WithThread extends EventBase {
  get thread(): LineChat {
    return LineChat.fromMessagingSource(this.channelId, this.payload.source!);
  }
}

// Mixin interfaces
class Repliable extends EventBase {
  /** Token for replying to the event. */
  get replyToken(): string {
    return this.payload.replyToken!;
  }
}

class Message extends EventBase {
  /** Message ID. */
  get messageId(): string {
    return this.payload.message!.id;
  }
}

class Text extends EventBase {
  /** Message text. */
  get text(): string {
    return (this.payload.message as LineRawTextMessage).text!;
  }

  /** Array of mentioned users. */
  get mentions() {
    return (
      (this.payload.message as LineRawTextMessage).mention?.mentionees || []
    );
  }

  /** Array of emojis. */
  get emojis(): any[] {
    return (this.payload.message as LineRawTextMessage).emojis || [];
  }
}

class Media extends EventBase {
  /** Content provider. */
  get contentProvider(): any {
    return (this.payload.message as LineRawMediaMessage).contentProvider;
  }
}

class Playable extends EventBase {
  /** Length of the media in milliseconds. */
  get duration(): number | undefined {
    return (this.payload.message as LineRawAudioMessage | LineRawVideoMessage)
      .duration;
  }
}

class FileContent extends EventBase {
  /** File name. */
  get fileName(): string {
    return (this.payload.message as LineRawFileMessage).fileName;
  }

  /** File size in bytes. */
  get fileSize(): number {
    return (this.payload.message as LineRawFileMessage).fileSize;
  }
}

class Location extends EventBase {
  /** Title. */
  get title(): string | undefined {
    return (this.payload.message as LineRawLocationMessage).title;
  }

  /** Address. */
  get address(): string | undefined {
    return (this.payload.message as LineRawLocationMessage).address;
  }

  /** Latitude. */
  get latitude(): number {
    return (this.payload.message as LineRawLocationMessage).latitude;
  }

  /** Longitude. */
  get longitude(): number {
    return (this.payload.message as LineRawLocationMessage).longitude;
  }
}

class Sticker extends EventBase {
  /** Package ID of the sticker. */
  get packageId(): string {
    return (this.payload.message as LineRawStickerMessage).packageId;
  }

  /** Sticker ID. */
  get stickerId(): string {
    return (this.payload.message as LineRawStickerMessage).stickerId;
  }

  /** Type of sticker resource. */
  get stickerResourceType(): string {
    return (this.payload.message as LineRawStickerMessage).stickerResourceType;
  }

  /** Array of keywords for the sticker. */
  get keywords(): string[] {
    return (this.payload.message as LineRawStickerMessage).keywords || [];
  }

  /** Text of the sticker. */
  get text(): string | undefined {
    return (this.payload.message as LineRawStickerMessage).text;
  }
}

class MemberJoined extends EventBase {
  /** Array of user source objects. */
  get joinedMembers(): UserSource[] {
    return this.payload.joined!.members;
  }
}

class MemberLeft extends EventBase {
  /** Array of user source objects. */
  get leftMMembers(): UserSource[] {
    return this.payload.left!.members;
  }
}

class Postback extends EventBase {
  /** Postback data. */
  get data(): string {
    return (this.payload.postback as LineRawPostbackData).data;
  }

  /** Object containing the date and time selected by the user. */
  get params(): Record<string, string> | undefined {
    return (this.payload.postback as LineRawPostbackData).params;
  }
}

class Beacon extends EventBase {
  /** Beacon hwid. */
  get hwid(): string {
    return this.payload.beacon!.hwid;
  }

  /** Device message. */
  get dm(): string | undefined {
    return this.payload.beacon!.dm;
  }

  /** ! event type. */
  get beaconType(): 'enter' | 'leave' | 'banner' | 'stay' {
    return this.payload.beacon!.type;
  }
}

class Membership extends EventBase {
  /** Membership ID that the user has joined, left, or renewed. */
  get membershipId(): number {
    return this.payload.membership!.membershipId;
  }
}

// Text Events
@mixin([Message, Text, WithThread])
export class TextMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'text' as const;
}
export interface TextMessageEvent extends Message, Text {}

// Image Events
@mixin([Message, Media, WithThread])
export class ImageMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'image' as const;
}
export interface ImageMessageEvent extends Message, Media {}

// Video Events
@mixin([Message, Media, Playable, WithThread])
export class VideoMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'video' as const;
}
export interface VideoMessageEvent extends Message, Media, Playable {}

// Audio Events
@mixin([Message, Media, Playable, WithThread])
export class AudioMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'audio' as const;
}
export interface AudioMessageEvent extends Message, Media, Playable {}

// File Events
@mixin([Message, FileContent, WithThread])
export class FileMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'file' as const;
}
export interface FileMessageEvent extends Message, FileContent {}

// Location Events
@mixin([Message, Location, WithThread])
export class LocationMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'location' as const;
}
export interface LocationMessageEvent extends Message, Location {}

// Sticker Events
@mixin([Message, Sticker, WithThread])
export class StickerMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'sticker' as const;
}
export interface StickerMessageEvent extends Message, Sticker {}

// Action Events
export class UnsendActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'unsend' as const;

  /** Unsent message ID. */
  get messageId(): string {
    return this.payload.unsend!.messageId;
  }
}

@mixin([Repliable, WithThread])
export class FollowActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'follow' as const;
}
export interface FollowActionEvent extends Repliable {}

export class UnfollowActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'unfollow' as const;
}

@mixin([Repliable, MemberJoined, WithThread])
export class JoinActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'join' as const;
}
export interface JoinActionEvent extends Repliable, MemberJoined {}

@mixin([MemberLeft, WithThread])
export class LeaveActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'leave' as const;
}
export interface LeaveActionEvent extends MemberLeft {}

@mixin([Repliable, MemberJoined, WithThread])
export class MemberJoinedActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'member_joined' as const;
}
export interface MemberJoinedActionEvent extends Repliable, MemberJoined {}

@mixin([MemberLeft, WithThread])
export class MemberLeftActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'member_left' as const;
}
export interface MemberLeftActionEvent extends MemberLeft {}

@mixin([Repliable, Postback, WithThread])
export class PostbackCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'postback' as const;
}
export interface PostbackCallbackEvent extends Repliable, Postback {}

@mixin([Repliable, Postback, WithThread])
export class DatePostbackCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'date_postback' as const;

  /** Date selected by the user. */
  get date(): string {
    return this.payload.postback!.params!.date!;
  }
}
export interface DatePostbackCallbackEvent extends Repliable, Postback {}

@mixin([Repliable, Postback, WithThread])
export class TimePostbackCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'time_postback' as const;

  /** Time selected by the user. */
  get timeValue(): string {
    return this.payload.postback!.params!.time!;
  }
}
export interface TimePostbackCallbackEvent extends Repliable, Postback {}

@mixin([Repliable, Postback, WithThread])
export class DatetimePostbackCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'datetime_postback' as const;

  /** Datetime selected by the user. */
  get datetime(): string {
    return this.payload.postback!.params!.datetime!;
  }
}
export interface DatetimePostbackCallbackEvent extends Repliable, Postback {}

@mixin([Repliable, Beacon, WithThread])
export class BeaconActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'beacon' as const;
}
export interface BeaconActionEvent extends Repliable, Beacon {}

@mixin([Repliable])
export class AccountLinkActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'account_link' as const;

  /** Result of the account link. */
  get result(): 'ok' | 'failed' {
    return this.payload.link!.result;
  }

  /** User ID of a user who has been link!ed with LINE account. */
  get nonce(): string {
    return this.payload.link!.nonce;
  }
}
export interface AccountLinkActionEvent extends Repliable {}
@mixin([Repliable])
export class VideoPlayCompleteActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'video_play_complete' as const;

  /**
   * ID used to identify a video. Same value as trackingId assigned to the video
   * message.
   */
  get trackingId(): string {
    return this.payload.videoPlayComplete!.trackingId;
  }
}
export interface VideoPlayCompleteActionEvent extends Repliable {}

@mixin([Repliable, Membership])
export class MembershipJoinedActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'membership_joined' as const;
}
export interface MembershipJoinedActionEvent extends Repliable, Membership {}

@mixin([Repliable, Membership])
export class MembershipLeftActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'membership_left' as const;
}
export interface MembershipLeftActionEvent extends Repliable, Membership {}

@mixin([Repliable, Membership])
export class MembershipRenewedActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'membership_renewed' as const;
}
export interface MembershipRenewedActionEvent extends Repliable, Membership {}

export class UnknownEvent extends EventBase {
  kind = 'unknown' as const;
  type = 'unknown' as const;
}

export type LineMessageEvent =
  | TextMessageEvent
  | ImageMessageEvent
  | VideoMessageEvent
  | AudioMessageEvent
  | FileMessageEvent
  | LocationMessageEvent
  | StickerMessageEvent;

export type LineActionEvent =
  | UnsendActionEvent
  | FollowActionEvent
  | UnfollowActionEvent
  | JoinActionEvent
  | LeaveActionEvent
  | MemberJoinedActionEvent
  | MemberLeftActionEvent
  | BeaconActionEvent
  | AccountLinkActionEvent
  | VideoPlayCompleteActionEvent
  | MembershipJoinedActionEvent
  | MembershipLeftActionEvent
  | MembershipRenewedActionEvent;

export type LineCallbackEvent =
  | PostbackCallbackEvent
  | DatePostbackCallbackEvent
  | TimePostbackCallbackEvent
  | DatetimePostbackCallbackEvent;

export type LineEvent =
  | LineMessageEvent
  | LineActionEvent
  | LineCallbackEvent
  | UnknownEvent;
