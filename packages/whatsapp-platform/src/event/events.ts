/* eslint-disable @typescript-eslint/no-empty-interface, @typescript-eslint/no-unsafe-declaration-merging */
import mixin from '@sociably/core/utils/mixin.js';
import { WHATSAPP } from '../constant.js';
import WhatsAppChat from '../Chat.js';
import WhatsAppUser from '../User.js';
import WhatsAppAgent from '../Agent.js';
import UserProfile from '../UserProfile.js';
import type {
  MessageData,
  StatusData,
  UserProfileData,
  ErrorData,
} from '../types.js';

class EventBase<Payload> {
  platform = WHATSAPP;

  constructor(
    public businessAccountId: string,
    public agentNumberId: string,
    public agentNumberDisplay: string,
    public payload: Payload,
  ) {}

  get agent() {
    return new WhatsAppAgent(this.agentNumberId);
  }

  // eslint-disable-next-line class-methods-use-this
  get userProfile(): UserProfile | undefined {
    return undefined;
  }

  readonly [Symbol.toStringTag] = 'WhatsAppEvent';
}

class MessageEventBase extends EventBase<MessageData> {
  constructor(
    businessAccountId: string,
    agentNumberId: string,
    agentNumberDisplay: string,
    payload: MessageData,
    protected profileData?: UserProfileData,
  ) {
    super(businessAccountId, agentNumberId, agentNumberDisplay, payload);
  }

  /** The ID for the message that was received by the business. */
  get messageId(): string {
    return this.payload.id;
  }

  /** The customer's phone number who sent the message to the business. */
  get userNumberId(): string {
    return this.payload.from;
  }

  /** The chat instance to reply the message with. */
  get thread(): WhatsAppChat {
    return new WhatsAppChat(this.agentNumberId, this.userNumberId);
  }

  /** The user who send the message */
  get user(): WhatsAppUser {
    return new WhatsAppUser(this.userNumberId, this.userProfile?.data);
  }

  /** The time when the customer sent the message to the business. */
  get time(): Date {
    return new Date(Number(this.payload.timestamp) * 1000);
  }

  get userProfile(): UserProfile | undefined {
    if (!this.profileData) {
      return undefined;
    }
    return new UserProfile(this.userNumberId, this.profileData);
  }

  /**
   * State of acknowledgment for the system customer_identity_change event. The
   * value is undefined if no identity change has occurred.
   */
  readonly isIdentityAcknowledged: boolean | undefined = undefined;

  /**
   * The time when the WhatsApp Business Management API detected the customer
   * may have changed their profile information
   */
  readonly identityChangeTime: Date | undefined = undefined;

  /** The ID for the messages system customer_identity_change event */
  readonly identityChangeHash: string | undefined = undefined;
}

abstract class Text extends MessageEventBase {
  /** The text of the message. */
  get text(): string {
    return this.payload.text?.body || '';
  }
}

abstract class Media extends MessageEventBase {
  /** The id of media. */
  get mediaId(): string {
    const type = this.payload.type;
    switch (type) {
      case 'audio':
        return this.payload.audio?.id || '';
      case 'image':
        return this.payload.image?.id || '';
      case 'video':
        return this.payload.video?.id || '';
      case 'document':
        return this.payload.document?.id || '';
      case 'sticker':
        return this.payload.sticker?.id || '';
      default:
        return '';
    }
  }

  /** The mime type for the media file */
  get mimeType(): string {
    const type = this.payload.type;
    switch (type) {
      case 'audio':
        return this.payload.audio?.mime_type || '';
      case 'image':
        return this.payload.image?.mime_type || '';
      case 'video':
        return this.payload.video?.mime_type || '';
      case 'document':
        return this.payload.document?.mime_type || '';
      case 'sticker':
        return this.payload.sticker?.mime_type || '';
      default:
        return '';
    }
  }
}

abstract class WithSha256 extends MessageEventBase {
  /** File hash. */
  get sha256(): string {
    const type = this.payload.type;
    switch (type) {
      case 'audio':
        return this.payload.audio?.sha256 || '';
      case 'image':
        return this.payload.image?.sha256 || '';
      case 'video':
        return this.payload.video?.sha256 || '';
      case 'document':
        return this.payload.document?.sha256 || '';
      case 'sticker':
        return this.payload.sticker?.sha256 || '';
      default:
        return '';
    }
  }
}

abstract class WithCaption extends MessageEventBase {
  /** Caption for the file, if provided */
  get caption(): string | undefined {
    const type = this.payload.type;
    switch (type) {
      case 'image':
        return this.payload.image?.caption;
      case 'video':
        return this.payload.video?.caption;
      case 'document':
        return this.payload.document?.caption;
      default:
        return undefined;
    }
  }
}

abstract class WithFilename extends MessageEventBase {
  /** Name for the file on the sender's device */
  get filename(): string {
    const type = this.payload.type;
    switch (type) {
      case 'video':
        return this.payload.video?.filename || '';
      case 'document':
        return this.payload.document?.filename || '';
      default:
        return '';
    }
  }
}

abstract class Interactive extends MessageEventBase {
  /** Attached callback data of the selected item */
  get callbackData(): string {
    const type = (this.payload.interactive as Record<string, unknown>)
      ?.type as string;
    return (
      ((
        (this.payload.interactive as Record<string, unknown>)?.[type] as Record<
          string,
          unknown
        >
      )?.id as string) || ''
    );
  }

  /** Title of the selected item */
  get title(): string {
    const type = (this.payload.interactive as Record<string, unknown>)
      ?.type as string;
    return (
      ((
        (this.payload.interactive as Record<string, unknown>)?.[type] as Record<
          string,
          unknown
        >
      )?.title as string) || ''
    );
  }
}

abstract class UserChange extends MessageEventBase {
  /** Describes the change to the customer's identity or phone number */
  get description(): string {
    return this.payload.system?.body || '';
  }

  /** The WhatsApp ID for the customer prior to the update */
  get originalNumber(): string {
    return this.payload.system?.wa_id || '';
  }
}

abstract class Referral extends MessageEventBase {
  /** The Meta URL that leads to the ad or post clicked by the customer */
  get sourceUrl(): string {
    return this.payload.referral?.source_url || '';
  }

  /** The type of the ad's source */
  get sourceType(): 'ad' | 'post' {
    return this.payload.referral?.source_type || 'ad';
  }

  /** Meta ID for an ad or a post */
  get sourceId(): string {
    return this.payload.referral?.source_id || '';
  }

  /** Headline used in the ad or post */
  get headline(): string {
    return this.payload.referral?.headline || '';
  }

  /** Body for the ad or post */
  get body(): string {
    return this.payload.referral?.body || '';
  }

  /** Media present in the ad or post */
  get mediaType(): 'image' | 'video' {
    return this.payload.referral?.media_type || 'image';
  }

  /** URL of the image, when mediaType is an `image` */
  get imageUrl(): string | undefined {
    return this.payload.referral?.image_url;
  }

  /** URL of the video, when mediaType is an `video` */
  get videoUrl(): string | undefined {
    return this.payload.referral?.video_url;
  }

  /** URL of the thumbnail, when mediaType is an `video` */
  get thumbnailUrl(): string | undefined {
    return this.payload.referral?.thumbnail_url;
  }

  /** Checks if this message has referral information */
  get hasReferralData(): boolean {
    return !!this.payload.referral;
  }
}

class StatusEventBase extends EventBase<StatusData> {
  /** The ID for the message that has status change. */
  get messageId(): string {
    return this.payload.id;
  }

  /** Date for the status change. */
  get time(): Date {
    return new Date(Number(this.payload.timestamp) * 1000);
  }

  /** The WhatsApp ID for the customer that the message is sent to */
  get userNumberId(): string {
    return this.payload.recipient_id;
  }

  /** The ID of the conversation the given status notification belongs to. */
  get conversationId(): string {
    return this.payload.conversation?.id || '';
  }

  /**
   * Indicates where a conversation has started. This can also be referred to as
   * a conversation entry point.
   */
  get conversationOriginType():
    | 'business_initiated'
    | 'customer_initiated'
    | 'referral_conversion' {
    return this.payload.conversation?.origin.type || 'customer_initiated';
  }

  /**
   * Date when the conversation expires. This field is only present for messages
   * with a `status` set to `sent`.
   */
  get conversationExpireTime(): Date | undefined {
    const timestamp = this.payload.conversation?.expiration_timestamp;
    return timestamp ? new Date(Number(timestamp) * 1000) : undefined;
  }

  /** The chat instance that the message is sent to. */
  get thread(): WhatsAppChat {
    return new WhatsAppChat(this.agentNumberId, this.userNumberId);
  }

  /** The customer user */
  get user(): WhatsAppUser {
    return new WhatsAppUser(this.userNumberId);
  }
}

// Text Message Events
@mixin([Text, Referral])
export class TextMessageEvent extends MessageEventBase {
  readonly kind = 'message';
  readonly type = 'text';
}
export interface TextMessageEvent extends MessageEventBase, Text, Referral {}

// Audio Message Events
@mixin([Media])
export class AudioMessageEvent extends MessageEventBase {
  readonly kind = 'message';
  readonly type = 'audio';
}
export interface AudioMessageEvent extends MessageEventBase, Media {}

// Image Message Events
@mixin([Media, WithSha256, WithCaption, Referral])
export class ImageMessageEvent extends MessageEventBase {
  readonly kind = 'message';
  readonly type = 'image';
}
export interface ImageMessageEvent
  extends MessageEventBase,
    Media,
    WithSha256,
    WithCaption,
    Referral {}

// Sticker Message Events
@mixin([Media, WithSha256])
export class StickerMessageEvent extends MessageEventBase {
  readonly kind = 'message';
  readonly type = 'sticker';
}
export interface StickerMessageEvent
  extends MessageEventBase,
    Media,
    WithSha256 {}

// Document Message Events
@mixin([Media, WithSha256, WithCaption, WithFilename, Referral])
export class DocumentMessageEvent extends MessageEventBase {
  readonly kind = 'message';
  readonly type = 'document';
}
export interface DocumentMessageEvent
  extends MessageEventBase,
    Media,
    WithSha256,
    WithCaption,
    WithFilename,
    Referral {}

// Video Message Events
@mixin([Media, WithSha256, WithCaption, WithFilename, Referral])
export class VideoMessageEvent extends MessageEventBase {
  readonly kind = 'message';
  readonly type = 'video';
}
export interface VideoMessageEvent
  extends MessageEventBase,
    Media,
    WithSha256,
    WithCaption,
    WithFilename,
    Referral {}

// Quick Reply Events
@mixin([Referral])
export class QuickReplyEvent extends MessageEventBase {
  readonly kind = 'callback';
  readonly type = 'quick_reply';

  /** The payload for a button set up by the business that a customer clicked */
  get callbackData(): string {
    return this.payload.quick_reply?.payload || '';
  }

  /** Button text */
  get text(): string {
    return this.payload.quick_reply?.text || '';
  }

  /** Set to true if the message received by the business has been forwarded */
  get isForwarded(): boolean {
    return !!this.payload.context?.from;
  }

  /**
   * Set to true if the message received by the business has been forwarded more
   * than 5 times
   */
  readonly isFrequentlyForwarded = false;

  /** The message ID for the sent message for an inbound reply */
  get repliedMessageId(): string {
    return this.payload.context?.id || '';
  }
}
export interface QuickReplyEvent extends MessageEventBase, Referral {}

// Contacts Message Events
export class ContactsMessageEvent extends MessageEventBase {
  readonly kind = 'message';
  readonly type = 'contacts';
}
export interface ContactsMessageEvent extends MessageEventBase {}

export class UnknownMessageEvent extends MessageEventBase {
  readonly kind = 'message';
  readonly type = 'unknown';

  get errorCode(): number {
    return this.payload.errors?.[0]?.code || 0;
  }

  get errorTitle(): string {
    return this.payload.errors?.[0]?.title || '';
  }

  get errorDetails(): string {
    return this.payload.errors?.[0]?.error_data?.details || '';
  }
}
export interface UnknownMessageEvent extends MessageEventBase {}

// Button Interactive Events
@mixin([Interactive, Referral])
export class ButtonInteractiveEvent extends MessageEventBase {
  readonly kind = 'callback';
  readonly type = 'button_interactive';
}
export interface ButtonInteractiveEvent
  extends MessageEventBase,
    Interactive,
    Referral {}

// List Interactive Events
@mixin([Interactive, Referral])
export class ListInteractiveEvent extends MessageEventBase {
  readonly kind = 'callback';
  readonly type = 'list_interactive';

  /** Description of the selected row */
  get description(): string {
    return this.payload.interactive?.list_reply?.description || '';
  }
}
export interface ListInteractiveEvent
  extends MessageEventBase,
    Interactive,
    Referral {}

// User Identity Change Events
@mixin([UserChange])
export class UserIdentityChangeEvent extends MessageEventBase {
  readonly kind = 'system';
  readonly type = 'user_identity_change';

  /** Identity of the change */
  get changeId(): string {
    return this.payload.system?.identity || '';
  }
}
export interface UserIdentityChangeEvent extends MessageEventBase, UserChange {}

// User Number Change Events
@mixin([UserChange])
export class UserNumberChangeEvent extends MessageEventBase {
  readonly kind = 'system';
  readonly type = 'user_number_change';

  /** New WhatsApp ID for the customer when their phone number is updated */
  get newNumber(): string {
    return this.payload.system?.new_wa_id || '';
  }
}
export interface UserNumberChangeEvent extends MessageEventBase, UserChange {}

// Status Events
export class ReadEvent extends StatusEventBase {
  readonly kind = 'action';
  readonly type = 'read';
}
export interface ReadEvent extends StatusEventBase {}

export class SentEvent extends StatusEventBase {
  readonly kind = 'system';
  readonly type = 'sent';
}
export interface SentEvent extends StatusEventBase {}

export class DeliveredEvent extends StatusEventBase {
  readonly kind = 'system';
  readonly type = 'delivered';
}
export interface DeliveredEvent extends StatusEventBase {}

export class FailedEvent extends StatusEventBase {
  readonly kind = 'system';
  readonly type = 'failed';
}
export interface FailedEvent extends StatusEventBase {}

// Error Events
export class ErrorEvent extends EventBase<ErrorData> {
  readonly kind = 'system';
  readonly type = 'error';
  readonly thread = null;
  readonly user = null;

  get code(): number {
    return this.payload.code || 0;
  }

  get title(): string {
    return this.payload.title || '';
  }
}

// Unknown Events
export class UnknownEvent extends EventBase<unknown> {
  readonly kind = 'message';
  readonly type = 'unknown';
  readonly thread = null;
  readonly user = null;
}

export type MessageEvent =
  | TextMessageEvent
  | AudioMessageEvent
  | ImageMessageEvent
  | StickerMessageEvent
  | DocumentMessageEvent
  | VideoMessageEvent
  | QuickReplyEvent
  | ButtonInteractiveEvent
  | ListInteractiveEvent
  | UserIdentityChangeEvent
  | UserNumberChangeEvent
  | ContactsMessageEvent
  | UnknownMessageEvent;

export type WhatsAppEvent =
  | MessageEvent
  | ReadEvent
  | SentEvent
  | DeliveredEvent
  | FailedEvent
  | ErrorEvent
  | UnknownEvent;
