export const EventBase = {
  platform: {
    enumerable: true,
    value: 'line',
  },
  user: {
    enumerable: true,
    get() {
      const { source } = this.raw;
      return source.userId === undefined ? null : source;
    },
  },
  userId: {
    enumerable: true,
    get() {
      return this.raw.source.userId;
    },
  },
  thread: {
    enumerable: true,
    get() {
      return this.raw.source;
    },
  },
  shouldRespond: {
    enumerable: true,
    value: false,
  },
  time: {
    enumerable: true,
    get() {
      return new Date(this.raw.timestamp);
    },
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

export const Repliable = {
  replyToken: {
    enumerable: true,
    get() {
      return this.raw.replyToken;
    },
  },
};

export const Message = {
  messageId: {
    enumerable: true,
    get() {
      return this.rwa.message.id;
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
};

export const Media = {
  url: {
    enumerable: true,
    get() {
      return `https://api.line.me/v2/bot/message/${this.messageId}/content`;
    },
  },
};

export const File = {
  fileName: {
    enumerable: true,
    get() {
      return this.raw.message.fileName;
    },
  },
  fileSize: {
    enumerable: true,
    get() {
      return this.raw.message.fileSize;
    },
  },
};

export const Location = {
  title: {
    enumerable: true,
    get() {
      return this.raw.message.title;
    },
  },
  address: {
    enumerable: true,
    get() {
      return this.raw.message.address;
    },
  },
  lat: {
    enumerable: true,
    get() {
      return this.raw.message.lat;
    },
  },
  long: {
    enumerable: true,
    get() {
      return this.raw.message.long;
    },
  },
};

export const Sticker = {
  packageId: {
    enumerable: true,
    get() {
      return this.raw.message.packageId;
    },
  },
  stickerId: {
    enumerable: true,
    get() {
      return this.raw.message.stickerId;
    },
  },
};

export const Postback = {
  data: {
    enumerable: true,
    get() {
      return this.raw.postback.data;
    },
  },
};

export const DateParam = {
  date: {
    enumerable: true,
    get() {
      return this.raw.postback.params.date;
    },
  },
};

export const TimeParam = {
  time: {
    enumerable: true,
    get() {
      return this.raw.postback.params.time;
    },
  },
};

export const DatetimeParam = {
  datetime: {
    enumerable: true,
    get() {
      return this.raw.postback.params.datetime;
    },
  },
};

export const Beacon = {
  hwid: {
    enumerable: true,
    get() {
      return this.beacon.hwid;
    },
  },
  actionType: {
    enumerable: true,
    get() {
      return this.beacon.type;
    },
  },
  deviceMessage: {
    enumerable: true,
    get() {
      return this.beacon.dm;
    },
  },
};

export const AccountLink = {
  result: {
    enumerable: true,
    get() {
      return this.raw.link.result;
    },
  },
  nonce: {
    enumerable: true,
    get() {
      return this.raw.link.nonce;
    },
  },
};
