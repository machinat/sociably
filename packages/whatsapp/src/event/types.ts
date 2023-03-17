import type {
  EventBaseMixin,
  MessageMixin,
  MediaMixin,
  WithTextMixin,
  WithSha256Mixin,
  WithCaptionMixin,
  WithFilenameMixin,
  InteractiveMixin,
  UserChangeMixin,
  StatusMixin,
} from './mixins';

/**
 * @category Event
 */
export interface TextEvent extends MessageMixin, WithTextMixin {
  readonly category: 'message';
  readonly type: 'text';
}

/**
 * @category Event
 */
export interface AudioEvent extends MediaMixin {
  readonly category: 'message';
  readonly type: 'audio';
}

/**
 * @category Event
 */
export interface ImageEvent
  extends MediaMixin,
    WithSha256Mixin,
    WithCaptionMixin {
  readonly category: 'message';
  readonly type: 'image';
}

/**
 * @category Event
 */
export interface StickerEvent extends MediaMixin, WithSha256Mixin {
  readonly category: 'message';
  readonly type: 'sticker';
}

/**
 * @category Event
 */
export interface DocumentEvent
  extends MediaMixin,
    WithSha256Mixin,
    WithCaptionMixin,
    WithFilenameMixin {
  readonly category: 'message';
  readonly type: 'document';
}

/**
 * @category Event
 */
export interface VideoEvent
  extends MediaMixin,
    WithSha256Mixin,
    WithCaptionMixin,
    WithFilenameMixin {
  readonly category: 'message';
  readonly type: 'video';
}

/**
 * @category Event
 */
export interface QuickReplyEvent extends MessageMixin {
  readonly category: 'postback';
  readonly type: 'quick_reply';
  /**
   * The payload for a button set up by the business that a customer clicked as
   * part of an interactive message
   */
  readonly data: string;
  /** Button text */
  readonly text: string;
  /** Set to true if the message received by the business has been forwarded */
  readonly isForwarded: boolean;
  /**
   * Set to true if the message received by the business has been forwarded more
   * than 5 times.
   */
  readonly isFrequentlyForwarded: boolean;
  /** The message ID for the sent message for an inbound reply */
  readonly repliedMessageId: string;
}

/**
 * @category Event
 */
export interface ContactsEvent extends MessageMixin {
  readonly category: 'message';
  readonly type: 'contacts';
}

/**
 * @category Event
 */
export interface InteractiveButtonEvent extends InteractiveMixin {
  readonly category: 'postback';
  readonly type: 'interactive_button';
}

/**
 * @category Event
 */
export interface InteractiveListEvent extends InteractiveMixin {
  readonly category: 'postback';
  readonly type: 'interactive_list';
  /** Description of the selected row */
  readonly description: string;
}

/**
 * @category Event
 */
export interface UserIdentityChangeEvent extends UserChangeMixin {
  readonly category: 'system';
  readonly type: 'user_identity_change';
  /** Identity of the change */
  readonly changeId: string;
}

/**
 * @category Event
 */
export interface UserNumberChangeEvent extends UserChangeMixin {
  readonly category: 'system';
  readonly type: 'user_number_change';
  /** New WhatsApp ID for the customer when their phone number is updated. */
  readonly newNumber: string;
}

/**
 * @category Event
 */
export interface ReferralEvent extends MessageMixin, WithTextMixin {
  readonly category: 'action';
  readonly type: 'referral';
  /**
   * The Meta URL that leads to the ad or post clicked by the customer. Opening
   * this url takes you to the ad viewed by your customer.
   */
  readonly sourceUrl: string;
  /** The type of the ad’s source */
  readonly sourceType: 'ad' | 'post';
  /** Meta ID for an ad or a post */
  readonly sourceId: string;
  /** Headline used in the ad or post */
  readonly headline: string;
  /** Body for the ad or post */
  readonly body: string;
  /** Media present in the ad or post */
  readonly mediaType: 'image' | 'video';
  /** URL of the image, when mediaType is an `image` */
  readonly imageUrl?: string;
  /** URL of the video, when mediaType is an `video` */
  readonly videoUrl?: string;
  /** URL of the thumbnail, when mediaType is an `video` */
  readonly thumbnailUrl?: string;
}

/**
 * @category Event
 */
export interface UnsupportedEvent extends MessageMixin {
  readonly category: 'message';
  readonly type: 'unsupported';
  readonly errorCode: number;
  readonly errorTitle: string;
  readonly errorDetails: string;
}

/**
 * @category Event
 */
export interface ReadEvent extends StatusMixin {
  readonly category: 'action';
  readonly type: 'read';
}

/**
 * @category Event
 */
export interface SentEvent extends StatusMixin {
  readonly category: 'system';
  readonly type: 'sent';
}

/**
 * @category Event
 */
export interface DeliveredEvent extends StatusMixin {
  readonly category: 'system';
  readonly type: 'delivered';
}

/**
 * @category Event
 */
export interface FailedEvent extends StatusMixin {
  readonly category: 'system';
  readonly type: 'failed';
}

/**
 * @category Event
 */
export interface ErrorEvent extends EventBaseMixin {
  readonly category: 'system';
  readonly type: 'error';
  readonly code: number;
  readonly title: string;
  readonly thread: null;
  readonly user: null;
}

/**
 * @category Event
 */
export interface UnknownEvent extends EventBaseMixin {
  readonly category: 'message';
  readonly type: 'unknown';
  readonly thread: null;
  readonly user: null;
}

export type MessageEvent =
  | TextEvent
  | AudioEvent
  | ImageEvent
  | StickerEvent
  | DocumentEvent
  | VideoEvent
  | QuickReplyEvent
  | InteractiveButtonEvent
  | InteractiveListEvent
  | UserIdentityChangeEvent
  | UserNumberChangeEvent
  | ReferralEvent
  | UnsupportedEvent;

export type WhatsAppEvent =
  | MessageEvent
  | ReadEvent
  | SentEvent
  | DeliveredEvent
  | FailedEvent
  | ErrorEvent
  | UnknownEvent;
