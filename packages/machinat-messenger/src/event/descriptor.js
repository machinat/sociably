export const MessengerEventBase = {
  platform: {
    enumerable: true,
    value: 'messenger',
  },
  sender: {
    enumerable: true,
    get() {
      return this.raw.sender;
    },
  },
  recipient: {
    enumerable: true,
    get() {
      return this.raw.recipient;
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

export const MessageBase = Object.assign({}, MessengerEventBase, {
  messageId: {
    enumerable: true,
    get() {
      return this.raw.message.mid;
    },
  },
});

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

export const DeliveryBase = Object.assign({}, MessengerEventBase, {
  delivery: {
    enumerable: true,
    get() {
      return this.raw.delivery;
    },
  },
});

export const ReadBase = Object.assign({}, MessengerEventBase, {
  read: {
    enumerable: true,
    get() {
      return this.raw.read;
    },
  },
});

export const Echo = {
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

export const AccountLinkingBase = Object.assign({}, MessengerEventBase, {
  accountLinking: {
    enumerable: true,
    get() {
      return this.raw.account_linking;
    },
  },
});

export const CheckoutUpdateBase = Object.assign({}, MessengerEventBase, {
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
});

export const GamePlayBase = Object.assign({}, MessengerEventBase, {
  gamePlay: {
    enumerable: true,
    get() {
      return this.raw.game_play;
    },
  },
});

export const PassThreadControlBase = Object.assign({}, MessengerEventBase, {
  passThreadControl: {
    enumerable: true,
    get() {
      return this.raw.pass_thread_control;
    },
  },
});

export const TakeThreadControlBase = Object.assign({}, MessengerEventBase, {
  takeThreadControl: {
    enumerable: true,
    get() {
      return this.raw.take_thread_control;
    },
  },
});

export const RequestThreadControlBase = Object.assign({}, MessengerEventBase, {
  requestThreadControl: {
    enumerable: true,
    get() {
      return this.raw.request_thread_control;
    },
  },
});

export const AppRolesBase = Object.assign({}, MessengerEventBase, {
  appRoles: {
    enumerable: true,
    get() {
      return this.raw.app_roles;
    },
  },
});

export const OptinBase = Object.assign({}, MessengerEventBase, {
  optin: {
    enumerable: true,
    get() {
      return this.raw.optin;
    },
  },
});

export const PaymentBase = Object.assign({}, MessengerEventBase, {
  payment: {
    enumerable: true,
    get() {
      return this.raw.payment;
    },
  },
});

export const PolicyEnforcementBase = Object.assign({}, MessengerEventBase, {
  payment: {
    enumerable: true,
    get() {
      return this.raw['policy-enforcement'];
    },
  },
});

export const PostbackBase = Object.assign({}, MessengerEventBase, {
  postback: {
    enumerable: true,
    get() {
      return this.raw.postback;
    },
  },
});

export const PaymentPreCheckoutBase = Object.assign({}, MessengerEventBase, {
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
});

export const ReferralBase = Object.assign({}, MessengerEventBase, {
  referral: {
    enumerable: true,
    get() {
      return this.raw.referral;
    },
  },
});
