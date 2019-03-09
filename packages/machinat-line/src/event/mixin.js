// @flow
import { toJSONWithProto } from 'machinat-base';
import { ChatThread } from '../thread';

export const EventBase = {
  platform: 'line',
  shouldRespond: false,

  get user() {
    const { source } = this.raw;
    return source.userId === undefined ? null : source;
  },

  get userId() {
    return this.raw.source.userId;
  },

  get thread() {
    return new ChatThread(
      this.raw.source,
      this.raw.replyToken,
      this._useReplyAPI
    );
  },

  get time() {
    return new Date(this.raw.timestamp);
  },
};

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
    return this.raw.replyToken;
  },
};

export const Message = {
  get messageId() {
    return this.rwa.message.id;
  },
};

export const Text = {
  get text() {
    return this.raw.message.text;
  },
};

export const Media = {
  get url() {
    return `https://api.line.me/v2/bot/message/${this.messageId}/content`;
  },
};

export const File = {
  get fileName() {
    return this.raw.message.fileName;
  },

  get fileSize() {
    return this.raw.message.fileSize;
  },
};

export const Location = {
  get title() {
    return this.raw.message.title;
  },

  get address() {
    return this.raw.message.address;
  },

  get lat() {
    return this.raw.message.lat;
  },

  get long() {
    return this.raw.message.long;
  },
};

export const Sticker = {
  get packageId() {
    return this.raw.message.packageId;
  },

  get stickerId() {
    return this.raw.message.stickerId;
  },
};

export const Postback = {
  get data() {
    return this.raw.postback.data;
  },
};

export const DateParam = {
  get date() {
    return this.raw.postback.params.date;
  },
};

export const TimeParam = {
  get time() {
    return this.raw.postback.params.time;
  },
};

export const DatetimeParam = {
  get datetime() {
    return this.raw.postback.params.datetime;
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
    return this.raw.link.result;
  },

  get nonce() {
    return this.raw.link.nonce;
  },
};

export const DeviceLink = {
  get deviceId() {
    return this.raw.things.deviceId;
  },

  get linked() {
    return this.raw.things.type === 'link';
  },
};
