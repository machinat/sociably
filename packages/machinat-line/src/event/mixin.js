// @flow
import { toJSONWithProto } from 'machinat-utility';

export const EventBase = {
  platform: 'line',

  get user() {
    const { source } = this.payload;
    return source.userId === undefined ? null : source;
  },

  get userId() {
    return this.payload.source.userId;
  },

  get time() {
    return new Date(this.payload.timestamp);
  },
};

// $FlowFixMe
Object.defineProperties(EventBase, {
  [Symbol.toStringTag]: {
    enumerable: false,
    value: 'LineEvent',
  },
  toJSON: {
    enumerable: false,
    value: toJSONWithProto,
  },
});

export const Repliable = {
  get replyToken() {
    return this.payload.replyToken;
  },
};

export const Message = {
  get messageId() {
    return this.rwa.message.id;
  },
};

export const Text = {
  get text() {
    return this.payload.message.text;
  },
};

export const Media = {
  get url() {
    return `https://api.line.me/v2/bot/message/${this.messageId}/content`;
  },
};

export const File = {
  get fileName() {
    return this.payload.message.fileName;
  },

  get fileSize() {
    return this.payload.message.fileSize;
  },
};

export const Location = {
  get title() {
    return this.payload.message.title;
  },

  get address() {
    return this.payload.message.address;
  },

  get lat() {
    return this.payload.message.lat;
  },

  get long() {
    return this.payload.message.long;
  },
};

export const Sticker = {
  get packageId() {
    return this.payload.message.packageId;
  },

  get stickerId() {
    return this.payload.message.stickerId;
  },
};

export const Postback = {
  get data() {
    return this.payload.postback.data;
  },
};

export const DateParam = {
  get date() {
    return this.payload.postback.params.date;
  },
};

export const TimeParam = {
  get time() {
    return this.payload.postback.params.time;
  },
};

export const DatetimeParam = {
  get datetime() {
    return this.payload.postback.params.datetime;
  },
};

export const Beacon = {
  get hwid() {
    return this.beacon.hwid;
  },

  get actionType() {
    return this.beacon.type;
  },

  get deviceMessage() {
    return this.beacon.dm;
  },
};

export const AccountLink = {
  get result() {
    return this.payload.link.result;
  },

  get nonce() {
    return this.payload.link.nonce;
  },
};

export const DeviceLink = {
  get deviceId() {
    return this.payload.things.deviceId;
  },

  get linked() {
    return this.payload.things.type === 'link';
  },
};
