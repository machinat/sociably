import camelcaseKeys from 'camelcase-keys';
import type { PsidTarget, UserRefTarget } from '../types.js';

/** @category Event Mixin */
export interface EventBase {
  /** Indicate whether the event is sent to a standby thread. */
  readonly isStandby: boolean;
  /** Indicate whether the event is an echo. */
  readonly isEcho: boolean;
  /** The user that triggered the webhook event. */
  readonly sender: PsidTarget | UserRefTarget;
  readonly timestamp: number;
  readonly [Symbol.toStringTag]: 'FacebookEvent';
}

export const EventBase: EventBase = {
  isStandby: false,
  isEcho: false,
  [Symbol.toStringTag]: 'FacebookEvent',

  get timestamp(): number {
    return this.payload.timestamp;
  },

  get sender() {
    return this.payload.sender;
  },
};

/** @category Event Mixin */
export interface Message {
  /** Message ID. */
  readonly messageId: string;
  /** Reference to the message id (mid) that this message is replying to. */
  readonly replyTo: undefined | string;
  /**
   * Reference to the product id when the user sends a message from Facebook
   * Shops product detail page.
   */
  readonly referralProductId: undefined | string;
}

export const Message: Message = {
  get messageId() {
    return this.payload.message.mid;
  },

  get replyTo() {
    return this.payload.message.reply_to?.mid;
  },

  get referralProductId() {
    return this.payload.message.referral?.product.id;
  },
};

/** @category Event Mixin */
export interface Text {
  /** Text of message. */
  readonly text: string;
}

export const Text: Text = {
  get text() {
    return this.payload.message.text;
  },
};

/** @category Event Mixin */
export interface Fallback {
  /** The fallback payload. */
  readonly fallback: undefined | { title: string; url: string };
}

export const Fallback: Fallback = {
  get fallback() {
    return this.payload.message.attachments?.[0];
  },
};

/** @category Event Mixin */
export interface Media {
  /** URL of the attachment type. */
  readonly url: string;
}

export const Media: Media = {
  get url() {
    return this.payload.message.attachments[0].payload.url;
  },
};

/** @category Event Mixin */
export interface Sticker {
  /** Persistent id of the sticker if a sticker is sent. */
  readonly stickerId: undefined | number;
}

export const Sticker: Sticker = {
  get stickerId() {
    return this.payload.message.attachments[0].payload.sticker_id;
  },
};

/** @category Event Mixin */
export interface QuickReply {
  /** Custom data provided by the app with the quick_reply. */
  readonly callbackData: string;
}

export const QuickReply: QuickReply = {
  get callbackData() {
    return this.payload.message.quick_reply.payload;
  },
};

/** @category Event Mixin */
export interface Nlp {
  /** The raw nlp object. */
  readonly nlp?: any;
}

export const Nlp: Nlp = {
  get nlp() {
    return this.payload.message.nlp;
  },
};

/** @category Event Mixin */
export interface Location {
  readonly latitude: number;
  readonly longitude: number;
}

export const Location: Location = {
  get latitude() {
    return this.payload.message.attachments[0].payload.lat;
  },

  get longitude() {
    return this.payload.message.attachments[0].payload.long;
  },
};

type ReactionType =
  | 'smile'
  | 'angry'
  | 'sad'
  | 'wow'
  | 'love'
  | 'like'
  | 'dislike'
  | 'other';

/** @category Event Mixin */
export interface Reaction {
  /** Text description of the reaction. */
  readonly reactionType: ReactionType;
  /** Reference to the emoji corresponding to the reaction. */
  readonly emoji: string;
  /** Action performed by the user. */
  readonly action: 'react' | 'unreact';
  /** Reference to the Message ID that the user performed the reaction on. */
  readonly messageId: string;
}

export const Reaction: Reaction = {
  get reactionType() {
    return this.payload.reaction.reaction;
  },

  get emoji() {
    return this.payload.reaction.emoji;
  },

  get action() {
    return this.payload.reaction.action;
  },

  get messageId() {
    return this.payload.reaction.mid;
  },
};

/** @category Event Mixin */
export interface TemplateProduct {
  readonly products: {
    id: string;
    retailerId: string;
    imageUrl: string;
    title: string;
    subtitle: string;
  }[];
}

export const TemplateProduct: TemplateProduct = {
  get products() {
    return this.payload.message.attachments[0].payload.product.elements.map(
      ({ retailer_id: retailerId, image_url: imageUrl, ...restElement }) => ({
        ...restElement,
        retailerId,
        imageUrl,
      }),
    );
  },
};

/** @category Event Mixin */
export interface Delivery {
  /**
   * Array containing message IDs of messages that were delivered. Field may not
   * be present.
   */
  readonly messageIds: undefined | string[];
  /** All messages that were sent before this timestamp were delivered. */
  readonly watermark: number;
}

export const Delivery: Delivery = {
  get messageIds() {
    return this.payload.delivery.mids;
  },

  get watermark() {
    return this.payload.delivery.watermark;
  },
};

/** @category Event Mixin */
export interface Read {
  /** All messages that were sent before or at this timestamp were read. */
  readonly watermark: number;
}

export const Read: Read = {
  get watermark() {
    return this.payload.read.watermark;
  },
};

/** @category Event Mixin */
export interface Echo {
  /** Indicate whether the event is an echo. */
  readonly isEcho: boolean;
  /** ID of the app from which the message was sent. */
  readonly appId: string;
  /**
   * Custom string passed to the Send API as the metadata field. Only present if
   * the metadata property was set in the original message.
   */
  readonly metadata: undefined | string;
}

export const Echo: Echo = {
  isEcho: true,
  get appId() {
    return this.payload.message.app_id;
  },

  get metadata() {
    return this.payload.message.metadata;
  },
};

/** @category Event Mixin */
export interface Standby {
  /** Indicate whether the event is sent to a standby thread. */
  readonly isStandby: boolean;
}

export const Standby: Standby = {
  isStandby: true,
};

/** @category Event Mixin */
export interface AccountLinking {
  /** Indicate whether the user linked or unlinked their account. */
  readonly status: 'linked' | 'unlinked';
  /**
   * Value of pass-through `authorization_code` provided in the Account Linking
   * flow.
   */
  readonly authorizationCode: string;
}

export const AccountLinking: AccountLinking = {
  get status() {
    return this.payload.account_linking.status;
  },

  get authorizationCode() {
    return this.payload.account_linking.authorization_code;
  },
};

/** @category Event Mixin */
export interface GamePlay {
  /** App ID of the game */
  readonly gameId: string;
  /**
   * ID of the user in the Instant Game name-space. By linking this ID to the
   * PSID received in the sender field, the bot can send messages to a user
   * after a game play
   */
  readonly playerId: string;
  /** Type of the social context a game is played in */
  readonly contextType: 'SOLO' | 'THREAD' | 'GROUP';
  /**
   * ID of the context if not a SOLO type. This ID is in the Instant Game
   * name-space
   */
  readonly contextId: string;
  /**
   * Best score achieved by this user in this game round. Only available to
   * Classic score based games
   */
  readonly score: undefined | number;
  /**
   * JSON encoded payload data, set using FBInstant.setSessionData(). Only
   * available to game with Rich Games Feature enabled
   */
  readonly callbackData: undefined | string;
}

export const GamePlay: GamePlay = {
  get gameId() {
    return this.payload.game_play.game_id;
  },
  get playerId() {
    return this.payload.game_play.player_id;
  },
  get contextType() {
    return this.payload.game_play.context_type;
  },
  get contextId() {
    return this.payload.game_play.context_id;
  },
  get score() {
    return this.payload.game_play.score;
  },
  get callbackData() {
    return this.payload.game_play.payload;
  },
};

/** @category Event Mixin */
export interface PassThreadControl {
  /** App ID that thread control is passed to. */
  readonly newOwnerAppId: string;
  /** Custom string specified in the API request. */
  readonly metadata: string;
}

export const PassThreadControl: PassThreadControl = {
  get newOwnerAppId() {
    return this.payload.pass_thread_control.new_owner_app_id;
  },

  get metadata() {
    return this.payload.pass_thread_control.metadata;
  },
};

/** @category Event Mixin */
export interface TakeThreadControl {
  /** App ID that thread control was taken from. */
  readonly previousOwnerAppId: string;
  /** Custom string specified in the API request. */
  readonly metadata: string;
}

export const TakeThreadControl: TakeThreadControl = {
  get previousOwnerAppId() {
    return this.payload.take_thread_control.previous_owner_app_id;
  },

  get metadata() {
    return this.payload.take_thread_control.metadata;
  },
};

/** @category Event Mixin */
export interface RequestThreadControl {
  /** App ID of the Secondary Receiver that is requesting thread control. */
  readonly requestedOwnerAppId: string;
  /** Custom string specified in the API request. */
  readonly metadata: string;
}

export const RequestThreadControl: RequestThreadControl = {
  get requestedOwnerAppId() {
    return this.payload.request_thread_control.requested_owner_app_id;
  },

  get metadata() {
    return this.payload.request_thread_control.metadata;
  },
};

/** @category Event Mixin */
export interface AppRoles {
  /** The app id and roles mapping object. */
  readonly appRoles: Record<string, string[]>;
}

export const AppRoles: AppRoles = {
  get appRoles() {
    return this.payload.app_roles;
  },
};

/** @category Event Mixin */
export interface Optin {
  /** The `data-ref` attribute that was defined with the entry point. */
  readonly dataRef: string;
  /**
   * [Checkbox
   * plugin](https://developers.facebook.com/docs/messenger-platform/discovery/checkbox-plugin)
   * only. user_ref attribute that was defined in the checkbox plugin include.
   */
  readonly userRef: undefined | string;
  readonly callbackData?: undefined;
}

export const Optin: Optin = {
  get dataRef() {
    return this.payload.optin.ref;
  },

  get userRef() {
    return this.payload.optin.user_ref;
  },
};

/** @category Event Mixin */
export interface OneTimeNotifOptin {
  /** The payload attached with the request message */
  readonly callbackData: string;
  /** The token to send one time notification with */
  readonly token: string;
}

export const OneTimeNotifOptin: OneTimeNotifOptin = {
  get callbackData() {
    return this.payload.optin.payload;
  },

  get token() {
    return this.payload.optin.one_time_notif_token;
  },
};

/** @category Event Mixin */
export interface PolicyEnforcement {
  readonly action: 'warning' | 'block' | 'unblock';
  /**
   * The reason for being warned or blocked. This field is absent if `action` is
   * `'unblock'`.
   */
  readonly reason: undefined | string;
}

export const PolicyEnforcement: PolicyEnforcement = {
  get action() {
    return this.payload['policy-enforcement'].action;
  },

  get reason() {
    return this.payload['policy-enforcement'].reason;
  },
};

type ReferralSource =
  | 'MESSENGER_CODE'
  | 'DISCOVER_TAB'
  | 'ADS'
  | 'SHORTLINK'
  | 'CUSTOMER_CHAT_PLUGIN';

/** @category Event Mixin */
export interface Referral {
  /** The source of the referral. */
  readonly source: ReferralSource;
  /** The optional `ref` attribute set in the referrer. */
  readonly ref: string;
  /** Id of ad if `source` is `'ADS'` */
  readonly adId?: string;
  /** The URI of the site where the message was sent in the Facebook chat plugin. */
  readonly refererUri?: string;
  /**
   * A flag indicating whether the user is a guest user from Facebook Chat
   * Plugin.
   */
  readonly isGuestUser?: boolean;
  /**
   * The data contaning information about the CTM ad, the user initiated the
   * thread from.
   */
  adsContextData?: {
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
  };
}

export const Referral: Referral = {
  get source() {
    return this.payload.referral.source;
  },

  get ref() {
    return this.payload.referral.ref;
  },

  get adId() {
    return this.payload.referral.ad_id;
  },

  get refererUri() {
    return this.payload.referral.referer_uri;
  },

  get isGuestUser() {
    return !!this.payload.referral.is_guest_user;
  },

  get adsContextData() {
    const data = this.payload.referral.ads_context_data;
    return data ? camelcaseKeys(data) : undefined;
  },
};

/** @category Event Mixin */
export interface Postback {
  /**
   * Title for the CTA that was clicked on. This is sent to all apps subscribed
   * to the page.
   */
  readonly title: string;
  /**
   * Payload parameter that was defined with the button. This is only visible to
   * the app that send the original template message.
   */
  readonly callbackData: string;

  /** Referral information for how the user got into the thread. */
  readonly referral?: Referral;
  /** The source of the referral if referral exist. */
  readonly referralSource?: ReferralSource;
  /** The optional `ref` attribute set in the referrer if referral exist. */
  readonly referralRef?: string;
  /** Id of ad if `referral.source` is `'ADS'`. */
  readonly referralAdId?: string;
}

export const Postback: Postback = {
  get title() {
    return this.payload.postback.title;
  },

  get callbackData() {
    return this.payload.postback.payload;
  },

  get referral() {
    const rawReferral = this.payload.postback.referral;
    return rawReferral ? camelcaseKeys(rawReferral, { deep: true }) : undefined;
  },

  get referralSource() {
    return this.payload.postback.referral?.source;
  },

  get referralRef() {
    return this.payload.postback.referral?.ref;
  },

  get referralAdId() {
    return this.payload.postback.referral?.ad_id;
  },
};
