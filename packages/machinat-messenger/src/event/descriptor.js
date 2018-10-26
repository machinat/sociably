export const EventBase = {
  platform: {
    enumerable: true,
    value: 'messenger',
  },
  user: {
    enumerable: true,
    get() {
      return this.raw.sender;
    },
  },
  userId: {
    enumerable: true,
    get() {
      return this.raw.sender.id;
    },
  },
  thread: {
    enumerable: true,
    get() {
      return this.type === 'optin' && this.raw.sender === undefined
        ? { user_ref: this.optin.user_ref }
        : this.raw.sender;
    },
  },
  threadId: {
    enumerable: true,
    get() {
      return this.raw.sender.id;
    },
  },
  shouldRespond: {
    enumerable: true,
    value: false,
  },
  toJSON: {
    value() {
      return JSON.stringify({
        raw: this.raw,
        ...Object.getPrototypeOf(this),
      });
    },
  },
};

export const Message = {
  messageId: {
    enumerable: true,
    get() {
      return this.raw.message.mid;
    },
  },
};

export const Media = {
  url: {
    enumerable: true,
    get() {
      return this.raw.message.attachments[0].payload.url;
    },
  },
};

export const Text = {
  text: {
    enumerable: true,
    get() {
      return this.raw.message.text;
    },
  },
  quickReply: {
    enumerable: true,
    get() {
      return this.raw.message.quick_reply;
    },
  },
  fallback: {
    enumerable: true,
    get() {
      const { attachments } = this.raw.message;
      return attachments && attachments[0];
    },
  },
};

export const NLP = {
  nlp: {
    enumerable: true,
    get() {
      return this.raw.message.nlp;
    },
  },
};

export const Location = {
  coordinates: {
    enumerable: true,
    get() {
      return this.raw.message.attachments[0].payload.coordinates;
    },
  },
};

export const Template = {
  template: {
    enumerable: true,
    get() {
      return this.raw.message.attachments[0].payload;
    },
  },
};

export const Delivery = {
  delivery: {
    enumerable: true,
    get() {
      return this.raw.delivery;
    },
  },
};

export const Read = {
  read: {
    enumerable: true,
    get() {
      return this.raw.read;
    },
  },
};

export const Echo = {
  isEcho: {
    enumerable: true,
    value: true,
  },
  appId: {
    enumerable: true,
    get() {
      return this.raw.message.app_id;
    },
  },
  metadata: {
    enumerable: true,
    get() {
      return this.raw.message.metadata;
    },
  },
};

export const AccountLinking = {
  accountLinking: {
    enumerable: true,
    get() {
      return this.raw.account_linking;
    },
  },
};

export const CheckoutUpdate = {
  shouldRespond: {
    enumerable: true,
    value: true,
  },
  checkoutUpdate: {
    enumerable: true,
    get() {
      return this.raw.checkout_update;
    },
  },
};

export const GamePlay = {
  gamePlay: {
    enumerable: true,
    get() {
      return this.raw.game_play;
    },
  },
};

export const PassThreadControl = {
  passThreadControl: {
    enumerable: true,
    get() {
      return this.raw.pass_thread_control;
    },
  },
};

export const TakeThreadControl = {
  takeThreadControl: {
    enumerable: true,
    get() {
      return this.raw.take_thread_control;
    },
  },
};

export const RequestThreadControl = {
  requestThreadControl: {
    enumerable: true,
    get() {
      return this.raw.request_thread_control;
    },
  },
};

export const AppRoles = {
  appRoles: {
    enumerable: true,
    get() {
      return this.raw.app_roles;
    },
  },
};

export const Optin = {
  optin: {
    enumerable: true,
    get() {
      return this.raw.optin;
    },
  },
};

export const Payment = {
  payment: {
    enumerable: true,
    get() {
      return this.raw.payment;
    },
  },
};

export const PolicyEnforcement = {
  payment: {
    enumerable: true,
    get() {
      return this.raw['policy-enforcement'];
    },
  },
};

export const Postback = {
  postback: {
    enumerable: true,
    get() {
      return this.raw.postback;
    },
  },
};

export const PaymentPreCheckout = {
  shouldRespond: {
    enumerable: true,
    value: true,
  },
  paymentPreCheckout: {
    enumerable: true,
    get() {
      return this.raw.payment_pre_checkout;
    },
  },
};

export const Referral = {
  referral: {
    enumerable: true,
    get() {
      return this.raw.referral;
    },
  },
};
