import { WHATSAPP } from '../constant.js';
import type WhatsAppChat from '../Chat.js';
import type WhatsAppUser from '../User.js';
import type WhatsAppAgent from '../Agent.js';
import type UserProfile from '../UserProfile.js';

export interface EventBaseMixin {
  readonly platform: typeof WHATSAPP;
  /** The WhatsApp Business Account ID for the business that is subscribed to the webhook. */
  businessAccountId: string;
  /** Unique ID for the receiving agent phone number. */
  agentNumberId: string;
  /** The phone number that is displayed for a business. */
  agentNumberDisplay: string;
  payload: any;
  readonly [Symbol.toStringTag]: 'WhatsAppEvent';
}

export interface MessageMixin extends EventBaseMixin {
  userProfile: UserProfile;
  /** The ID for the message that was received by the business. */
  readonly messageId: string;
  /** The customer's phone number who sent the message to the business. */
  readonly userNumberId: string;
  /** The chat instance to reply the message with. */
  readonly thread: WhatsAppChat;
  /** The user who send the message */
  readonly user: WhatsAppUser;
  /** The agent that user communicates with */
  readonly channel: WhatsAppAgent;
  /** The time when the customer sent the message to the business. */
  readonly time: Date;
  /**
   * State of acknowledgment for the system customer_identity_change event.
   * The value is undeinfed if no identity change has ocurred.
   */
  readonly isIdentityAcknowledged?: boolean;
  /**
   * The time when the WhatsApp Business Management API detected the customer
   * may have changed their profile information
   */
  readonly identityChangeTime?: Date;
  /** The ID for the messages system customer_identity_change event */
  readonly identityChangeHash?: string;
}

export interface WithTextMixin {
  /** The text of the message. */
  readonly text: string;
}

export interface MediaMixin extends MessageMixin {
  /** The id of media. */
  readonly mediaId: string;
  /** The mime type for the media file */
  readonly mimeType: string;
}

export interface WithSha256Mixin {
  /** File hash. */
  readonly sha256: string;
}

export interface WithCaptionMixin {
  /** Caption for the file, if provided */
  readonly caption?: string;
}

export interface WithFilenameMixin {
  /** Name for the file on the sender's device */
  readonly filename: string;
}

export interface InteractiveMixin extends MessageMixin {
  /** Unique ID of the selcted item */
  readonly replyId: string;
  /** Title of the selcted item */
  readonly title: string;
}

export interface UserChangeMixin extends MessageMixin {
  /** Describes the change to the customer's identity or phone number */
  readonly description: string;
  /** The WhatsApp ID for the customer prior to the update */
  readonly originalNumber: string;
}

export interface StatusMixin extends EventBaseMixin {
  /** The ID for the message that has status change. */
  readonly messageId: string;
  /** Date for the status change. */
  readonly time: Date;
  /** The WhatsApp ID for the customer that the message is sent to */
  readonly userNumberId: string;
  /** The ID of the conversation the given status notification belongs to. */
  readonly conversationId: string;
  /**
   * Indicates where a conversation has started. This can also be referred to as
   * a conversation entry point.
   */
  readonly conversationOriginType:
    | 'business_initiated'
    | 'customer_initiated'
    | 'referral_conversion';
  /**
   * Date when the conversation expires. This field is only present for messages
   * with a `status` set to `sent`.
   */
  readonly conversationExpireTime?: Date;
  /** The chat instance that the message is sent to. */
  readonly thread: WhatsAppChat;
  /** The customer user */
  readonly user: WhatsAppUser;
  /** The agent that user communicates with */
  readonly channel: WhatsAppAgent;
}
