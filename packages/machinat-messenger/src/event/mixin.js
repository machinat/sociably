// @flow
import { toJSONWithProto } from 'machinat-base';
import { ChatThread } from '../thread';

export const EventBase = {
  platform: 'messenger',
  shouldRespond: false,

  get user() {
    return this.raw.sender;
  },

  get userId() {
    return this.raw.sender.id;
  },

  get thread() {
    const source =
      this.type === 'optin' && this.raw.sender === undefined
        ? { user_ref: this.optin.user_ref }
        : this.raw.sender;

    return new ChatThread(source);
  },
};

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
    return this.raw.message.mid;
  },
};

export const Media = {
  get url() {
    return this.raw.message.attachments[0].payload.url;
  },
};

export const Text = {
  get text() {
    return this.raw.message.text;
  },

  get quickReply() {
    return this.raw.message.quick_reply;
  },

  get fallback() {
    const { attachments } = this.raw.message;
    return attachments && attachments[0];
  },
};

export const NLP = {
  get nlp() {
    return this.raw.message.nlp;
  },
};

export const Location = {
  get coordinates() {
    return this.raw.message.attachments[0].payload.coordinates;
  },
};

export const Template = {
  get template() {
    return this.raw.message.attachments[0].payload;
  },
};

export const Delivery = {
  get delivery() {
    return this.raw.delivery;
  },
};

export const Read = {
  get read() {
    return this.raw.read;
  },
};

export const Echo = {
  isEcho: true,
  get appId() {
    return this.raw.message.app_id;
  },

  get metadata() {
    return this.raw.message.metadata;
  },
};

export const AccountLinking = {
  get accountLinking() {
    return this.raw.account_linking;
  },
};

export const CheckoutUpdate = {
  shouldRespond: true,
  get checkoutUpdate() {
    return this.raw.checkout_update;
  },
};

export const GamePlay = {
  get gamePlay() {
    return this.raw.game_play;
  },
};

export const PassThreadControl = {
  get passThreadControl() {
    return this.raw.pass_thread_control;
  },
};

export const TakeThreadControl = {
  get takeThreadControl() {
    return this.raw.take_thread_control;
  },
};

export const RequestThreadControl = {
  get requestThreadControl() {
    return this.raw.request_thread_control;
  },
};

export const AppRoles = {
  get appRoles() {
    return this.raw.app_roles;
  },
};

export const Optin = {
  get optin() {
    return this.raw.optin;
  },
};

export const Payment = {
  get payment() {
    return this.raw.payment;
  },
};

export const PolicyEnforcement = {
  payment() {
    return this.raw['policy-enforcement'];
  },
};

export const Postback = {
  get postback() {
    return this.raw.postback;
  },
};

export const PaymentPreCheckout = {
  shouldRespond: true,
  get paymentPreCheckout() {
    return this.raw.payment_pre_checkout;
  },
};

export const Referral = {
  get referral() {
    return this.raw.referral;
  },
};
