/* eslint-disable class-methods-use-this, @typescript-eslint/class-literal-property-style */
import camelcaseKeys from 'camelcase-keys';
import {
  SociablyAgent,
  SociablyEvent,
  SociablyThread,
  SociablyUser,
} from '@sociably/core';
import type { PsidTarget, UserRefTarget } from '../types.js';

import { MessagingTarget } from '../types.js';

export type EventInstancesCreator<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> = {
  createAgent: (pageId: string) => Agent;
  createChat: (pageId: string, target: MessagingTarget) => Chat;
  createUser: (pageId: string, userId: string) => User;
};

/** @category Event */
export class EventBase<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> {
  readonly [Symbol.toStringTag] = 'FacebookMessengerEvent';

  /** The page that the event is sent to. */
  readonly agent: Agent;

  constructor(
    protected instancesCreator: EventInstancesCreator<Agent, Chat, User>,
    /** The page ID that the event is sent to. */
    readonly pageId: string,
    /** The raw event payload received from webhook. */
    readonly payload: any,
    /** Indicate whether the event is sent to a standby thread. */
    readonly isStandby = false,
  ) {
    this.agent = this.instancesCreator.createAgent(this.pageId);
  }

  /** The messaging platform that the event is sent to. */
  get platform(): string {
    return this.agent.platform;
  }

  /** The chat that the event is sent to. */
  get thread(): null | Chat {
    const { payload, pageId, instancesCreator } = this;
    return payload.sender
      ? instancesCreator.createChat(pageId, payload.sender)
      : null;
  }

  /** The user that the event is sent to. */
  get user(): null | User {
    const { payload, pageId, instancesCreator } = this;
    return payload.sender?.id
      ? instancesCreator.createUser(pageId, payload.sender.id)
      : null;
  }

  /** Indicate whether the event is an echo. */
  get isEcho(): boolean {
    return false;
  }

  /** The time when the event was triggered. */
  get time(): Date {
    return new Date(this.payload.timestamp);
  }

  get timestamp(): number {
    return this.payload.timestamp;
  }

  /** The user that triggered the webhook event. */
  get sender(): PsidTarget | UserRefTarget {
    return this.payload.sender;
  }
}

/** @category Event */
export class MessageEventBase<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  get thread(): Chat {
    return this.isEcho
      ? this.instancesCreator.createChat(this.pageId, this.payload.recipient)
      : this.instancesCreator.createChat(this.pageId, this.payload.sender);
  }

  get user(): User {
    return this.isEcho
      ? this.instancesCreator.createUser(this.pageId, this.payload.recipient.id)
      : this.instancesCreator.createUser(this.pageId, this.payload.sender.id);
  }

  /** Message ID. */
  get messageId() {
    return this.payload.message.mid;
  }

  /** Reference to the message id (mid) that this message is replying to. */
  get replyTo() {
    return this.payload.message.reply_to?.mid;
  }

  /**
   * Reference to the product id when the user sends a message from Facebook
   * Shops product detail page.
   */
  get referralProductId() {
    return this.payload.message.referral?.product.id;
  }

  /** Indicate whether the event is an echo. */
  get isEcho() {
    return !!this.payload.message.is_echo;
  }

  /** ID of the app from which the message was sent. */
  get echoAppId() {
    return this.payload.message.app_id;
  }

  /**
   * Custom string passed to the Send API as the metadata field. Only present if
   * the metadata property was set in the original message.
   */
  get echoMetadata() {
    return this.payload.message.metadata;
  }
}

/**
 * Represents a text message sent by a user.
 *
 * @category Event
 */
export class TextMessageEvent<
    Agent extends SociablyAgent,
    Chat extends SociablyThread,
    User extends SociablyUser,
  >
  extends MessageEventBase<Agent, Chat, User>
  implements SociablyEvent<unknown>
{
  readonly kind = 'message';
  readonly type = 'text';

  /** Text of message. */
  get text(): string {
    return this.payload.message.text;
  }

  /** The raw nlp object. */
  get nlp(): unknown | undefined {
    return this.payload.message.nlp;
  }

  /** The fallback payload. */
  get fallback(): undefined | { title: string; url: string } {
    return this.payload.message.attachments?.[0];
  }

  get description(): string {
    return this.text;
  }
}

/**
 * Represents a fallback attachment message when unsupported content is shared.
 *
 * @category Event
 */
export class FallbackMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MessageEventBase<Agent, Chat, User> {
  readonly kind = 'message';
  readonly type = 'fallback';

  /** The fallback payload. */
  get fallback(): undefined | { title: string; url: string } {
    return this.payload.message.attachments?.[0];
  }

  get description(): string {
    return this.fallback
      ? `User shared an attachment: ${this.fallback.title} (${this.fallback.url})`
      : 'User shared an unsupported attachment';
  }
}

/**
 * Base class for media attachment events (image, audio, video, file).
 *
 * @category Event
 */
export class MediaMessageEventBase<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MessageEventBase<Agent, Chat, User> {
  /** URL of the attachment type. */
  get url(): string {
    return this.payload.message.attachments[0].payload.url;
  }
}

/**
 * Represents an image attachment message sent by a user.
 *
 * @category Event
 */
export class ImageMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MediaMessageEventBase<Agent, Chat, User> {
  readonly kind = 'message';
  readonly type = 'image';

  /** Persistent id of the sticker if a sticker is sent. */
  get stickerId(): undefined | number {
    return this.payload.message.attachments[0].payload.sticker_id;
  }

  get description(): string {
    return this.stickerId
      ? `User sent a sticker (ID: ${this.stickerId})`
      : `User sent an image (${this.url})`;
  }
}

/** Represents an audio attachment message sent by a user. */
export class AudioMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MediaMessageEventBase<Agent, Chat, User> {
  readonly kind = 'message';
  readonly type = 'audio';

  get description(): string {
    return `User sent an audio file (${this.url})`;
  }
}

/** Represents a video attachment message sent by a user. */
export class VideoMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MediaMessageEventBase<Agent, Chat, User> {
  readonly kind = 'message';
  readonly type = 'video';

  get description(): string {
    return `User sent a video file (${this.url})`;
  }
}

/** Represents a file attachment message sent by a user. */
export class FileMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MediaMessageEventBase<Agent, Chat, User> {
  readonly kind = 'message';
  readonly type = 'file';

  get description(): string {
    return `User sent a file attachment (${this.url})`;
  }
}

/**
 * Represents a quick reply button selection by a user.
 *
 * @category Event
 */
export class QuickReplyMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MessageEventBase<Agent, Chat, User> {
  readonly kind = 'callback';
  readonly type = 'quick_reply';

  /** Text of the quick reply. */
  get text(): string {
    return this.payload.message.text;
  }

  /** Custom data provided by the app with the quick_reply. */
  get callbackData(): string {
    return this.payload.message.quick_reply.payload;
  }

  get description(): string {
    return `User selected a quick reply button with text "${this.text}" and data "${this.callbackData}"`;
  }
}

/**
 * Represents a location sharing message sent by a user.
 *
 * @category Event
 */
export class LocationMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MessageEventBase<Agent, Chat, User> {
  readonly kind = 'message';
  readonly type = 'location';

  get latitude(): number {
    return this.payload.message.attachments[0].payload.lat;
  }

  get longitude(): number {
    return this.payload.message.attachments[0].payload.long;
  }

  get description(): string {
    return `User shared a location (lat: ${this.latitude}, long: ${this.longitude})`;
  }
}

type ReactionType =
  | 'smile'
  | 'angry'
  | 'sad'
  | 'wow'
  | 'love'
  | 'like'
  | 'dislike'
  | 'other';

/**
 * Represents a reaction (like, love, angry, etc.) added to or removed from a
 * message.
 *
 * @category Event
 */
export class ReactionEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'action';
  readonly type = 'reaction';

  /** Text description of the reaction. */
  get reactionType(): ReactionType {
    return this.payload.reaction.reaction;
  }

  /** Reference to the emoji corresponding to the reaction. */
  get emoji(): string {
    return this.payload.reaction.emoji;
  }

  /** Action performed by the user. */
  get action(): 'react' | 'unreact' {
    return this.payload.reaction.action;
  }

  /** Reference to the Message ID that the user performed the reaction on. */
  get messageId(): string {
    return this.payload.reaction.mid;
  }

  get description(): string {
    const actionText = this.action === 'react' ? 'added' : 'removed';
    return `User ${actionText} a reaction "${this.reactionType}" on message ID "${this.messageId}"`;
  }
}

/**
 * Represents an unsupported message type that cannot be processed.
 *
 * @category Event
 */
export class UnknownMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends MessageEventBase<Agent, Chat, User> {
  readonly kind = 'unknown';
  readonly type = 'unknown';

  get description(): string {
    return 'User sent a message type that is not supported';
  }
}

/**
 * Represents a product template message when users share products.
 *
 * @category Event
 */
export class ProductTemplateMessageEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'message';
  readonly type = 'product_template';

  get products(): {
    id: string;
    retailerId: string;
    imageUrl: string;
    title: string;
    subtitle: string;
  }[] {
    return this.payload.message.attachments[0].payload.product.elements.map(
      ({ retailer_id: retailerId, image_url: imageUrl, ...restElement }) => ({
        ...restElement,
        retailerId,
        imageUrl,
      }),
    );
  }

  get description(): string {
    return `User referred the following products: ${this.products
      .map((p) => JSON.stringify(p))
      .join('; ')}`;
  }
}

/**
 * Represents a message delivery confirmation from Messenger.
 *
 * @category Event
 */
export class DeliveryEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'system';
  readonly type = 'delivery';
  /**
   * Array containing message IDs of messages that were delivered. Field may not
   * be present.
   */
  get messageIds(): undefined | string[] {
    return this.payload.delivery.mids;
  }

  /** All messages that were sent before this timestamp were delivered. */
  get watermark(): number {
    return this.payload.delivery.watermark;
  }

  get description(): string {
    return `Messages delivered up to watermark ${this.watermark}${
      this.messageIds ? `, message IDs: "${this.messageIds.join('", "')}"` : ''
    }`;
  }
}

/**
 * Represents a read receipt indicating that messages have been read by the
 * user.
 *
 * @category Event
 */
export class ReadEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'action';
  readonly type = 'read';

  /** All messages that were sent before or at this timestamp were read. */
  get watermark(): number {
    return this.payload.read.watermark;
  }

  get description(): string {
    return `User read messages up to watermark ${this.watermark}`;
  }
}

/**
 * Represents an account linking or unlinking event.
 *
 * @category Event
 */
export class AccountLinkingEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'action';
  readonly type = 'account_linking';

  /** Indicate whether the user linked or unlinked their account. */
  get status(): 'linked' | 'unlinked' {
    return this.payload.account_linking.status;
  }

  /**
   * Value of pass-through `authorization_code` provided in the Account Linking
   * flow.
   */
  get authorizationCode(): string {
    return this.payload.account_linking.authorization_code;
  }

  get description(): string {
    return `User ${this.status} their account${
      this.authorizationCode
        ? ` with authorization code: "${this.authorizationCode}"`
        : ''
    }`;
  }
}

/**
 * Represents a game play event from an Instant Game.
 *
 * @category Event
 */
export class GamePlayEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'action';
  readonly type = 'game_play';

  /** App ID of the game */
  get gameId(): string {
    return this.payload.game_play.game_id;
  }

  /**
   * ID of the user in the Instant Game name-space. By linking this ID to the
   * PSID received in the sender field, the bot can send messages to a user
   * after a game play
   */
  get playerId(): string {
    return this.payload.game_play.player_id;
  }

  /** Type of the social context a game is played in */
  get contextType(): 'SOLO' | 'THREAD' | 'GROUP' {
    return this.payload.game_play.context_type;
  }

  /**
   * ID of the context if not a SOLO type. This ID is in the Instant Game
   * name-space
   */
  get contextId(): string {
    return this.payload.game_play.context_id;
  }

  /**
   * Best score achieved by this user in this game round. Only available to
   * Classic score based games
   */
  get score(): undefined | number {
    return this.payload.game_play.score;
  }

  /**
   * JSON encoded payload data, set using FBInstant.setSessionData(). Only
   * available to game with Rich Games Feature enabled
   */
  get callbackData(): undefined | string {
    return this.payload.game_play.payload;
  }

  get description(): string {
    const scoreText =
      this.score !== undefined ? ` with score ${this.score}` : '';
    return `User played game "${this.gameId}" in "${this.contextType}" context${scoreText}`;
  }
}

/**
 * Represents a thread control handover event when control is passed to another
 * app.
 *
 * @category Event
 */
export class PassThreadControlEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'system';
  readonly type = 'pass_thread_control';

  /** App ID that thread control is passed to. */
  get newOwnerAppId(): string {
    return this.payload.pass_thread_control.new_owner_app_id;
  }

  /** Custom string specified in the API request. */
  get metadata(): string {
    return this.payload.pass_thread_control.metadata;
  }

  get description(): string {
    return `Thread control passed to app "${this.newOwnerAppId}"${
      this.metadata ? ` with metadata: "${this.metadata}"` : ''
    }`;
  }
}

/**
 * Represents a thread control takeover event when an app takes control from
 * another.
 *
 * @category Event
 */
export class TakeThreadControlEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'system';
  readonly type = 'take_thread_control';

  /** App ID that thread control was taken from. */
  get previousOwnerAppId(): string {
    return this.payload.take_thread_control.previous_owner_app_id;
  }

  /** Custom string specified in the API request. */
  get metadata(): string {
    return this.payload.take_thread_control.metadata;
  }

  get description(): string {
    return `Thread control taken from app "${this.previousOwnerAppId}"${
      this.metadata ? ` with metadata: "${this.metadata}"` : ''
    }`;
  }
}

/**
 * Represents a thread control request event when an app requests control.
 *
 * @category Event
 */
export class RequestThreadControlEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'system';
  readonly type = 'request_thread_control';

  /** App ID of the Secondary Receiver that is requesting thread control. */
  get requestedOwnerAppId(): string {
    return this.payload.request_thread_control.requested_owner_app_id;
  }

  /** Custom string specified in the API request. */
  get metadata(): string {
    return this.payload.request_thread_control.metadata;
  }

  get description(): string {
    return `App "${this.requestedOwnerAppId}" requested thread control${
      this.metadata ? ` with metadata: "${this.metadata}"` : ''
    }`;
  }
}

/**
 * Represents an app roles change event for the page.
 *
 * @category Event
 */
export class AppRolesEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'system';
  readonly type = 'app_roles';

  /** The app id and roles mapping object. */
  get appRoles(): Record<string, string[]> {
    return this.payload.app_roles;
  }

  get description(): string {
    const roleEntries = Object.entries(this.appRoles);
    const roleDescriptions = roleEntries.map(
      ([appId, roles]) => `"${appId}": ["${roles.join('", "')}"]`,
    );
    return `App roles changed: ${roleDescriptions.join(', ')}`;
  }
}

/**
 * Represents an opt-in event when a user subscribes to messaging through
 * various entry points.
 *
 * @category Event
 */
export class OptinEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'action';
  readonly type = 'optin';

  get thread(): Chat {
    const { optin, sender } = this.payload;
    const { createChat } = this.instancesCreator;
    return sender
      ? createChat(this.pageId, sender)
      : createChat(this.pageId, { user_ref: optin.user_ref });
  }

  get user(): User | null {
    const { sender } = this.payload;
    return sender
      ? this.instancesCreator.createUser(this.pageId, sender.id)
      : null;
  }

  /** The `data-ref` attribute that was defined with the entry point. */
  get dataRef(): string {
    return this.payload.optin.ref;
  }

  /**
   * [Checkbox
   * plugin](https://developers.facebook.com/docs/messenger-platform/discovery/checkbox-plugin)
   * only. user_ref attribute that was defined in the checkbox plugin include.
   */
  get userRef(): undefined | string {
    return this.payload.optin.user_ref;
  }

  readonly callbackData = undefined;

  get description(): string {
    const refText = this.dataRef ? ` with ref "${this.dataRef}"` : '';
    const userRefText = this.userRef ? ` (user_ref: "${this.userRef}")` : '';
    return `User opted in to messaging${refText}${userRefText}`;
  }
}

/**
 * Represents a one-time notification opt-in event when a user grants permission
 * for notifications.
 *
 * @category Event
 */
export class OneTimeNotifOptinEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'action';
  readonly type = 'one_time_notif_optin';

  get thread(): Chat {
    const { payload, pageId, instancesCreator } = this;
    return instancesCreator.createChat(pageId, payload.sender);
  }

  get user(): User {
    const { payload, pageId, instancesCreator } = this;
    return instancesCreator.createUser(pageId, payload.sender.id);
  }

  /** The payload attached with the request message */
  get callbackData(): string {
    return this.payload.optin.payload;
  }

  /** The token to send one time notification with */
  get token(): string {
    return this.payload.optin.one_time_notif_token;
  }

  get description(): string {
    return `User granted one-time notification permission with payload "${this.callbackData}" and token: "${this.token}"`;
  }
}

/**
 * Represents a policy enforcement event when Facebook takes action due to
 * policy violations.
 *
 * @category Event
 */
export class PolicyEnforcementEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'system';
  readonly type = 'policy_enforcement';

  get action(): 'warning' | 'block' | 'unblock' {
    return this.payload['policy-enforcement'].action;
  }

  /**
   * The reason for being warned or blocked. This field is absent if `action` is
   * `'unblock'`.
   */
  get reason(): undefined | string {
    return this.payload['policy-enforcement'].reason;
  }

  get description(): string {
    const reasonText = this.reason ? ` for reason: "${this.reason}"` : '';
    return `Policy enforcement action: "${this.action}"${reasonText}`;
  }
}

type ReferralSource =
  | 'MESSENGER_CODE'
  | 'DISCOVER_TAB'
  | 'ADS'
  | 'SHORTLINK'
  | 'CUSTOMER_CHAT_PLUGIN';

/**
 * Represents a referral event when a user starts a conversation through various
 * entry points.
 *
 * @category Event
 */
export class ReferralEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'action';
  readonly type = 'referral';

  get thread(): Chat {
    const { payload, pageId, instancesCreator } = this;
    return instancesCreator.createChat(pageId, payload.sender);
  }

  get user(): User | null {
    const { payload, pageId, instancesCreator } = this;
    return payload.sender.id
      ? instancesCreator.createUser(pageId, payload.sender.id)
      : null;
  }

  /** The source of the referral. */
  get source(): ReferralSource {
    return this.payload.referral.source;
  }

  /** The optional `ref` attribute set in the referrer. */
  get ref(): string {
    return this.payload.referral.ref;
  }

  /** Id of ad if `source` is `'ADS'` */
  get adId(): string | undefined {
    return this.payload.referral.ad_id;
  }

  /** The URI of the site where the message was sent in the Facebook chat plugin. */
  get refererUri(): string | undefined {
    return this.payload.referral.referer_uri;
  }

  /**
   * A flag indicating whether the user is a guest user from Facebook Chat
   * Plugin.
   */
  get isGuestUser(): boolean | undefined {
    return !!this.payload.referral.is_guest_user;
  }

  /**
   * The data containing information about the CTM ad, the user initiated the
   * thread from.
   */
  get adsContextData():
    | {
        /** Title of the Ad. */
        adTitle?: string;
        /** Url of the image from the Ad the user is interested. */
        photoUrl?: string;
        /** Thumbnail url of the the video from the ad. */
        videoUrl?: string;
        /** ID of the post. */
        postId?: string;
        /** Product ID from the Ad the user is interested. */
        productId?: string;
      }
    | undefined {
    const data = this.payload.referral.ads_context_data;
    return data ? camelcaseKeys(data) : undefined;
  }

  get description(): string {
    const sourceText = this.source;
    const refText = this.ref ? ` with ref "${this.ref}"` : '';
    const adText = this.adId ? ` from ad "${this.adId}"` : '';
    return `User started conversation via "${sourceText}"${refText}${adText}`;
  }
}

/**
 * Represents a postback event when a user clicks a postback button.
 *
 * @category Event
 */
export class PostbackEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'callback';
  readonly type = 'postback';

  get thread(): Chat {
    const { payload, pageId, instancesCreator } = this;
    return instancesCreator.createChat(pageId, payload.sender);
  }

  get user(): User | null {
    const { payload, pageId, instancesCreator } = this;
    return payload.sender.id
      ? instancesCreator.createUser(pageId, payload.sender.id)
      : null;
  }

  /**
   * Title for the CTA that was clicked on. This is sent to all apps subscribed
   * to the page.
   */
  get title(): string {
    return this.payload.postback.title;
  }

  /**
   * Payload parameter that was defined with the button. This is only visible to
   * the app that send the original template message.
   */
  get callbackData(): string {
    return this.payload.postback.payload;
  }

  /** Referral information for how the user got into the thread. */
  get referral(): undefined | Record<string, unknown> {
    const rawReferral = this.payload.postback.referral;
    return rawReferral ? camelcaseKeys(rawReferral, { deep: true }) : undefined;
  }

  /** The source of the referral if referral exist. */
  get referralSource(): ReferralSource | undefined {
    return this.payload.postback.referral?.source;
  }

  /** The optional `ref` attribute set in the referrer if referral exist. */
  get referralRef(): string | undefined {
    return this.payload.postback.referral?.ref;
  }

  /** Id of ad if `referral.source` is `'ADS'`. */
  get referralAdId(): string | undefined {
    return this.payload.postback.referral?.ad_id;
  }

  get description(): string {
    const referralText = this.referral
      ? ` with referral from "${this.referralSource}"`
      : '';
    return `User clicked postback button "${this.title}" with payload "${this.callbackData}"${referralText}`;
  }
}

/**
 * Represents an unknown event type that cannot be processed.
 *
 * @category Event
 */
export class UnknownEvent<
  Agent extends SociablyAgent,
  Chat extends SociablyThread,
  User extends SociablyUser,
> extends EventBase<Agent, Chat, User> {
  readonly kind = 'unknown';
  readonly type = 'unknown';

  get description(): string {
    return 'Unknown event type that is not supported';
  }
}

export type FacebookMessengerEvent<
  Agent extends SociablyAgent,
  Thread extends SociablyThread,
  User extends SociablyUser,
> =
  | TextMessageEvent<Agent, Thread, User>
  | ImageMessageEvent<Agent, Thread, User>
  | VideoMessageEvent<Agent, Thread, User>
  | AudioMessageEvent<Agent, Thread, User>
  | FileMessageEvent<Agent, Thread, User>
  | LocationMessageEvent<Agent, Thread, User>
  | ProductTemplateMessageEvent<Agent, Thread, User>
  | FallbackMessageEvent<Agent, Thread, User>
  | ReactionEvent<Agent, Thread, User>
  | QuickReplyMessageEvent<Agent, Thread, User>
  | DeliveryEvent<Agent, Thread, User>
  | ReadEvent<Agent, Thread, User>
  | AccountLinkingEvent<Agent, Thread, User>
  | GamePlayEvent<Agent, Thread, User>
  | PassThreadControlEvent<Agent, Thread, User>
  | TakeThreadControlEvent<Agent, Thread, User>
  | RequestThreadControlEvent<Agent, Thread, User>
  | AppRolesEvent<Agent, Thread, User>
  | OptinEvent<Agent, Thread, User>
  | OneTimeNotifOptinEvent<Agent, Thread, User>
  | PolicyEnforcementEvent<Agent, Thread, User>
  | ReferralEvent<Agent, Thread, User>
  | PostbackEvent<Agent, Thread, User>
  | UnknownMessageEvent<Agent, Thread, User>
  | UnknownEvent<Agent, Thread, User>;
