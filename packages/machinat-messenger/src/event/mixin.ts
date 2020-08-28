import { MESSENGER } from '../constant';

/**
 * @category Event Mixin
 */
export const EventBase = {
  platform: MESSENGER,
  isStandby: false,
  get sender() {
    return this.payload.sender;
  },
  get senderId() {
    return this.payload.sender.id;
  },
};

Object.defineProperties(EventBase, {
  [Symbol.toStringTag]: {
    enumerable: false,
    value: 'MessengerEvent',
  },
});

/**
 * @category Event Mixin
 */
export const Message = {
  get messageId() {
    return this.payload.message.mid;
  },
};

/**
 * @category Event Mixin
 */
export const Media = {
  get url() {
    return this.payload.message.attachments[0].payload.url;
  },
};

/**
 * @category Event Mixin
 */
export const Text = {
  get text() {
    return this.payload.message.text;
  },
  get fallback() {
    const { attachments } = this.payload.message;
    return attachments && attachments[0];
  },
};

/**
 * @category Event Mixin
 */
export const QuickReplyPostback = {
  get quickReply() {
    return this.payload.message.quick_reply;
  },
  get data() {
    return this.payload.message.quick_reply.payload;
  },
};

/**
 * @category Event Mixin
 */
export const NLP = {
  get nlp() {
    return this.payload.message.nlp;
  },
};

/**
 * @category Event Mixin
 */
export const Location = {
  get coordinates() {
    return this.payload.message.attachments[0].payload.coordinates;
  },
};

/**
 * @category Event Mixin
 */
export const Template = {
  get template() {
    return this.payload.message.attachments[0].payload;
  },
};

/**
 * @category Event Mixin
 */
export const Delivery = {
  get delivery() {
    return this.payload.delivery;
  },
};

/**
 * @category Event Mixin
 */
export const Read = {
  get read() {
    return this.payload.read;
  },
};

/**
 * @category Event Mixin
 */
export const Echo = {
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
export const AccountLinking = {
  get accountLinking() {
    return this.payload.account_linking;
  },
};

/**
 * @category Event Mixin
 */
export const CheckoutUpdate = {
  get checkoutUpdate() {
    return this.payload.checkout_update;
  },
};

/**
 * @category Event Mixin
 */
export const GamePlay = {
  get gamePlay() {
    return this.payload.game_play;
  },
};

/**
 * @category Event Mixin
 */
export const PassThreadControl = {
  get passThreadControl() {
    return this.payload.pass_thread_control;
  },
};

/**
 * @category Event Mixin
 */
export const TakeThreadControl = {
  get takeThreadControl() {
    return this.payload.take_thread_control;
  },
};

/**
 * @category Event Mixin
 */
export const RequestThreadControl = {
  get requestThreadControl() {
    return this.payload.request_thread_control;
  },
};

/**
 * @category Event Mixin
 */
export const AppRoles = {
  get appRoles() {
    return this.payload.app_roles;
  },
};

/**
 * @category Event Mixin
 */
export const Optin = {
  get optin() {
    return this.payload.optin;
  },
};

/**
 * @category Event Mixin
 */
export const Payment = {
  get payment() {
    return this.payload.payment;
  },
};

/**
 * @category Event Mixin
 */
export const PolicyEnforcement = {
  payment() {
    return this.payload['policy-enforcement'];
  },
};

/**
 * @category Event Mixin
 */
export const Postback = {
  get postback() {
    return this.payload.postback;
  },
  get data() {
    return this.payload.postback.payload;
  },
};

/**
 * @category Event Mixin
 */
export const PreCheckout = {
  get preCheckout() {
    return this.payload.pre_checkout;
  },
};

/**
 * @category Event Mixin
 */
export const Referral = {
  get referral() {
    return this.payload.referral;
  },
};

/**
 * @category Event Mixin
 */
export const Standby = {
  isStandby: true,
};
