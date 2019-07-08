// @flow
import { toJSONWithProto } from 'machinat-utility';
import { MESSENGER } from '../constant';

export const EventBase = {
  platform: MESSENGER,

  get user() {
    return this.payload.sender;
  },

  get userId() {
    return this.payload.sender.id;
  },
};

// $FlowFixMe
Object.defineProperties(EventBase, {
  [Symbol.toStringTag]: {
    enumerable: false,
    value: 'MessengerEvent',
  },
  toJSON: {
    enumerable: false,
    value: toJSONWithProto,
  },
});

export const Message = {
  get messageId() {
    return this.payload.message.mid;
  },
};

export const Media = {
  get url() {
    return this.payload.message.attachments[0].payload.url;
  },
};

export const Text = {
  get text() {
    return this.payload.message.text;
  },

  get quickReply() {
    return this.payload.message.quick_reply;
  },

  get fallback() {
    const { attachments } = this.payload.message;
    return attachments && attachments[0];
  },
};

export const NLP = {
  get nlp() {
    return this.payload.message.nlp;
  },
};

export const Location = {
  get coordinates() {
    return this.payload.message.attachments[0].payload.coordinates;
  },
};

export const Template = {
  get template() {
    return this.payload.message.attachments[0].payload;
  },
};

export const Delivery = {
  get delivery() {
    return this.payload.delivery;
  },
};

export const Read = {
  get read() {
    return this.payload.read;
  },
};

export const Echo = {
  isEcho: true,
  get appId() {
    return this.payload.message.app_id;
  },

  get metadata() {
    return this.payload.message.metadata;
  },
};

export const AccountLinking = {
  get accountLinking() {
    return this.payload.account_linking;
  },
};

export const CheckoutUpdate = {
  get checkoutUpdate() {
    return this.payload.checkout_update;
  },
};

export const GamePlay = {
  get gamePlay() {
    return this.payload.game_play;
  },
};

export const PassThreadControl = {
  get passThreadControl() {
    return this.payload.pass_thread_control;
  },
};

export const TakeThreadControl = {
  get takeThreadControl() {
    return this.payload.take_thread_control;
  },
};

export const RequestThreadControl = {
  get requestThreadControl() {
    return this.payload.request_thread_control;
  },
};

export const AppRoles = {
  get appRoles() {
    return this.payload.app_roles;
  },
};

export const Optin = {
  get optin() {
    return this.payload.optin;
  },
};

export const Payment = {
  get payment() {
    return this.payload.payment;
  },
};

export const PolicyEnforcement = {
  payment() {
    return this.payload['policy-enforcement'];
  },
};

export const Postback = {
  get postback() {
    return this.payload.postback;
  },
};

export const PreCheckout = {
  get preCheckout() {
    return this.payload.pre_checkout;
  },
};

export const Referral = {
  get referral() {
    return this.payload.referral;
  },
};
