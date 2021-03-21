/* eslint-disable camelcase */
import { MESSENGER } from '../constant';
import type { PSIDTarget, UserRefTarget } from '../types';

/**
 * @category Event Mixin
 */
export interface EventBase {
  readonly platform: typeof MESSENGER;
  /** Indicate whether the event is sent to a standby channel. */
  readonly isStandby: boolean;
  /** Indicate whether the event is an echo. */
  readonly isEcho: boolean;
  /** The user that triggered the webhook event. */
  readonly sender: PSIDTarget | UserRefTarget;
  readonly timestamp: number;
  readonly [Symbol.toStringTag]: 'MessengerEvent';
}

/** @internal */
export const EventBase: EventBase = {
  platform: MESSENGER,
  isStandby: false,
  isEcho: false,
  [Symbol.toStringTag]: 'MessengerEvent',

  get timestamp(): number {
    return this.payload.timestamp;
  },

  get sender() {
    return this.payload.sender;
  },
};

/**
 * @category Event Mixin
 */
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

/** @internal */
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

/**
 * @category Event Mixin
 */
export interface Text {
  /** Text of message. */
  readonly text: string;
}

/** @internal */
export const Text: Text = {
  get text() {
    return this.payload.message.text;
  },
};

/**
 * @category Event Mixin
 */
export interface Fallback {
  /** The fallback payload. */
  readonly fallback: undefined | { title: string; url: string };
}

/** @internal */
export const Fallback: Fallback = {
  get fallback() {
    return this.payload.message.attachments?.[0];
  },
};

/**
 * @category Event Mixin
 */
export interface Media {
  /** URL of the attachment type. */
  readonly url: string;
}

/** @internal */
export const Media: Media = {
  get url() {
    return this.payload.message.attachments[0].payload.url;
  },
};

/**
 * @category Event Mixin
 */
export interface Sticker {
  /** Persistent id of the sticker if a sticker is sent. */
  readonly stickerId: undefined | string;
}

/** @internal */
export const Sticker: Sticker = {
  get stickerId() {
    return this.payload.message.attachments[0].payload.sticker_id;
  },
};

/**
 * @category Event Mixin
 */
export interface QuickReply {
  /** Custom data provided by the app with the quick_reply. */
  readonly data: string;
}

/** @internal */

export const QuickReply: QuickReply = {
  get data() {
    return this.payload.message.quick_reply.payload;
  },
};

/**
 * @category Event Mixin
 */
export interface NLP {
  /** The raw nlp object. */
  readonly nlp?: any;
}

/** @internal */
export const NLP: NLP = {
  get nlp() {
    return this.payload.message.nlp;
  },
};

/**
 * @category Event Mixin
 */
export interface Location {
  readonly latitude: number;
  readonly longitude: number;
}

/** @internal */
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

/**
 * @category Event Mixin
 */
export interface Reaction {
  /** The raw `reaction` object. */
  readonly reaction: {
    reaction: ReactionType;
    emoji: string;
    action: 'react' | 'unreact';
    mid: string;
  };

  /** Text description of the reaction. */
  readonly reactionType: ReactionType;
  /** Reference to the emoji corresponding to the reaction. */
  readonly emoji: string;
  /** Action performed by the user. */
  readonly action: 'react' | 'unreact';
  /** Reference to the Message ID that the user performed the reaction on. */
  readonly messageId: string;
}

/** @internal */
export const Reaction: Reaction = {
  get reaction() {
    return this.payload.reaction;
  },

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

/**
 * @category Event Mixin
 */
export interface Template {
  readonly template: any;
}

/** @internal */
export const Template: Template = {
  get template() {
    return this.payload.message.attachments[0].payload;
  },
};

/**
 * @category Event Mixin
 */
export interface TemplateProduct {
  readonly productElements: {
    id: string;
    retailer_id: string;
    image_url: string;
    title: string;
    subtitle: string;
  }[];
}

/** @internal */
export const TemplateProduct: TemplateProduct = {
  get productElements() {
    return this.payload.message.attachments[0].payload.product.elements;
  },
};

/**
 * @category Event Mixin
 */
export interface Delivery {
  /** The raw `dilivery` object. */
  readonly delivery: { messageIds: string[]; watermark: number };
  /**
   * Array containing message IDs of messages that were delivered. Field may not
   * be present.
   */
  readonly messageIds: undefined | string[];
  /** All messages that were sent before this timestamp were delivered. */
  readonly watermark: number;
}

/** @internal */
export const Delivery: Delivery = {
  get delivery() {
    return this.payload.delivery;
  },

  get messageIds() {
    return this.payload.delivery.mids;
  },

  get watermark() {
    return this.payload.delivery.watermark;
  },
};

/**
 * @category Event Mixin
 */
export interface Read {
  /** The raw `read` object. */
  readonly read: { watermark: number };
  /** All messages that were sent before or at this timestamp were read. */
  readonly watermark: number;
}

/** @internal */
export const Read: Read = {
  get read() {
    return this.payload.read;
  },
  get watermark() {
    return this.payload.read.watermark;
  },
};

/**
 * @category Event Mixin
 */
export interface Echo {
  /** Indicate whether the event is an echo. */
  readonly isEcho: boolean;
  /** ID of the app from which the message was sent. */
  readonly appId: string;
  /**
   * Custom string passed to the Send API as the metadata field. Only present
   * if the metadata property was set in the original message.
   */
  readonly metadata: undefined | string;
}

/** @internal */
export const Echo: Echo = {
  isEcho: true,
  get appId() {
    return this.payload.message.app_id;
  },

  get metadata() {
    return this.payload.message.metadata;
  },
};

/**
 * @category Event Mixin
 */
export interface Standby {
  /** Indicate whether the event is sent to a standby channel. */
  readonly isStandby: boolean;
}

/** @internal */
export const Standby: Standby = {
  isStandby: true,
};

/**
 * @category Event Mixin
 */
export interface AccountLinking {
  /** The raw `account_linking` object. */
  readonly accountLinking: {
    status: 'linked' | 'unlinked';
    authorization_code: string;
  };
  /** Indicate whether the user linked or unlinked their account. */
  readonly status: 'linked' | 'unlinked';
  /**
   * Value of pass-through `authorization_code` provided in the Account Linking
   * flow.
   */
  readonly authorizationCode: string;
}

/** @internal */
export const AccountLinking: AccountLinking = {
  get accountLinking() {
    return this.payload.account_linking;
  },

  get status() {
    return this.payload.account_linking.status;
  },

  get authorizationCode() {
    return this.payload.account_linking.authorization_code;
  },
};

/**
 * @category Event Mixin
 */
export interface GamePlay {
  /** The raw `game_play` object. */
  readonly gamePlay: {
    game_id: string;
    player_id: string;
    context_type: 'SOLO' | 'THREAD' | 'GROUP';
    context_id: string;
    score: undefined | number;
    payload: undefined | string;
  };
}

/** @internal */
export const GamePlay: GamePlay = {
  get gamePlay() {
    return this.payload.game_play;
  },
};

/**
 * @category Event Mixin
 */
export interface PassThreadControl {
  /** The raw `pass_thread_control` object. */
  readonly passThreadControl: { new_owner_app_id: string; metadata: string };
  /** App ID that thread control is passed to. */
  readonly newOwnerAppId: string;
  /** Custom string specified in the API request. */
  readonly metadata: string;
}

/** @internal */
export const PassThreadControl: PassThreadControl = {
  get passThreadControl() {
    return this.payload.pass_thread_control;
  },

  get newOwnerAppId() {
    return this.payload.pass_thread_control.new_owner_app_id;
  },

  get metadata() {
    return this.payload.pass_thread_control.metadata;
  },
};

/**
 * @category Event Mixin
 */
export interface TakeThreadControl {
  /** The raw `take_thread_control` object. */
  readonly takeThreadControl: {
    previous_owner_app_id: string;
    metadata: string;
  };
  /** App ID that thread control was taken from. */
  readonly previousOwnerAppId: string;
  /** Custom string specified in the API request. */
  readonly metadata: string;
}

/** @internal */
export const TakeThreadControl: TakeThreadControl = {
  get takeThreadControl() {
    return this.payload.take_thread_control;
  },

  get previousOwnerAppId() {
    return this.payload.take_thread_control.previous_owner_app_id;
  },

  get metadata() {
    return this.payload.take_thread_control.metadata;
  },
};

/**
 * @category Event Mixin
 */
export interface RequestThreadControl {
  /** The raw `request_thread_control` object. */
  readonly requestThreadControl: {
    requested_owner_app_id: string;
    metadata: string;
  };
  /** App ID of the Secondary Receiver that is requesting thread control. */
  readonly requestedOwnerAppId: string;
  /** Custom string specified in the API request. */
  readonly metadata: string;
}

/** @internal */
export const RequestThreadControl: RequestThreadControl = {
  get requestThreadControl() {
    return this.payload.request_thread_control;
  },

  get requestedOwnerAppId() {
    return this.payload.request_thread_control.requested_owner_app_id;
  },

  get metadata() {
    return this.payload.request_thread_control.metadata;
  },
};

/**
 * @category Event Mixin
 */
export interface AppRoles {
  /** The app id and roles mapping object. */
  readonly appRoles: { [id: string]: string[] };
}

/** @internal */
export const AppRoles: AppRoles = {
  get appRoles() {
    return this.payload.app_roles;
  },
};

/**
 * @category Event Mixin
 */
export interface Optin {
  /** The raw `optin` object. */
  readonly optin: { ref: string; user_ref: undefined | string };
  /** The `data-ref` attribute that was defined with the entry point. */
  readonly dataRef: string;
  /**
   * [Checkbox plugin](https://developers.facebook.com/docs/messenger-platform/discovery/checkbox-plugin)
   * only. user_ref attribute that was defined in the checkbox plugin include.
   */
  readonly userRef: undefined | string;
}

/** @internal */
export const Optin: Optin = {
  get optin() {
    return this.payload.optin;
  },

  get dataRef() {
    return this.payload.optin.ref;
  },

  get userRef() {
    return this.payload.optin.user_ref;
  },
};

/**
 * @category Event Mixin
 */
export interface PolicyEnforcement {
  /** The raw `policy_enforcement` object. */
  readonly policyEnforcement: { action: 'block' | 'unblock'; reason: string };
  readonly action: 'warning' | 'block' | 'unblock';
  /**
   * The reason for being warned or blocked. This field is absent if `action` is
   * `'unblock'`.
   */
  readonly reason: undefined | string;
}

/** @internal */
export const PolicyEnforcement: PolicyEnforcement = {
  get policyEnforcement() {
    return this.payload['policy-enforcement'];
  },

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

type RawReferral = {
  source: ReferralSource;
  type: 'OPEN_THREAD';
  ref: string;
  ad_id: undefined | string;
  referer_uri: undefined | string;
  is_guest_user: undefined | boolean;
};

/**
 * @category Event Mixin
 */
export interface Referral {
  /** The raw `referral` object. */
  readonly referral: RawReferral;
  /** The source of the referral. */
  readonly source: ReferralSource;
  /** The optional `ref` attribute set in the referrer. */
  readonly ref: string;
  /** Id of ad if `source` is `'ADS'` */
  readonly adId: undefined | string;
  /**
   * The URI of the site where the message was sent in the Facebook chat plugin.
   */
  readonly refererUri: undefined | string;
  /**
   * A flag indicating whether the user is a guest user from Facebook Chat
   * Plugin.
   */
  readonly isGuestUser: boolean;
}

/** @internal */
export const Referral: Referral = {
  get referral() {
    return this.payload.referral;
  },

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
};

/**
 * @category Event Mixin
 */
export interface Postback {
  /** The raw `postback` object. */
  readonly postback: { title: string; payload: string; referral: any };
  /**
   * Title for the CTA that was clicked on. This is sent to all apps subscribed
   * to the page. For apps other than the original CTA sender, the postback
   * event will be delivered via the standby channel.
   */
  readonly title: string;
  /**
   * Payload parameter that was defined with the button. This is only visible to
   * the app that send the original template message.
   */
  readonly data: string;

  /** Referral information for how the user got into the thread. */
  readonly referral: undefined | RawReferral;
  /** The source of the referral if referral exist. */
  readonly referralSource: undefined | ReferralSource;
  /** The optional `ref` attribute set in the referrer if referral exist. */
  readonly referralRef: undefined | string;
  /** Id of ad if `referral.source` is `'ADS'`. */
  readonly referralAdId: undefined | string;
}

/** @internal */
export const Postback: Postback = {
  get postback() {
    return this.payload.postback;
  },

  get title() {
    return this.payload.postback.title;
  },

  get data() {
    return this.payload.postback.payload;
  },

  get referral() {
    return this.payload.postback.referral;
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
