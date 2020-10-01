import type { LineSource, UserSource } from '../types';

/**
 * @category Event Mixin
 */
export interface EventBase {
  readonly platform: 'line';
  /**
   * Source user, group, or room object with information about the source of the
   * event.
   */
  readonly source: LineSource;
  /** ID of the source user. */
  readonly userId: undefined | string;
  /** Time of the event in milliseconds. */
  readonly timestamp: number;
  [Symbol.toStringTag]: 'LineEvent';
}

/** @internal */
export const EventBase: EventBase = {
  platform: 'line',

  get source() {
    return this.payload.source;
  },

  get userId() {
    return this.payload.source.userId;
  },

  get timestamp() {
    return this.payload.timestamp;
  },

  [Symbol.toStringTag]: 'LineEvent',
};

/**
 * @category Event Mixin
 */
export interface Repliable {
  /** Token for replying to the event. */
  readonly replyToken: string;
}

/** @internal */
export const Repliable: Repliable = {
  get replyToken() {
    return this.payload.replyToken;
  },
};

/**
 * @category Event Mixin
 */
export interface Message {
  /** Message ID. */
  readonly messageId: string;
}

/** @internal */
export const Message: Message = {
  get messageId() {
    return this.payload.message.id;
  },
};

type EmojiObject = {
  index: number;
  length: number;
  productId: string;
  emojiId: string;
};

/**
 * @category Event Mixin
 */
export interface Text {
  /**
   * Message text. If text contains LINE emojis, the emojis property will
   * contain an array of LINE emoji objects.
   */
  readonly text: string;
  readonly emojis: undefined | EmojiObject[];
}

/** @internal */
export const Text: Text = {
  get text() {
    return this.payload.message.text;
  },

  get emojis() {
    return this.payload.message.emojis;
  },
};

type MediaContentProvider = {
  /**
   * Provider of the image file.
   *  line:     The image was sent by a LINE user. The binary image data can be
   *            retrieved from the content endpoint.
   *  external: The image was sent using the LIFF liff.sendMessages() method.
   *            For more information, see liff.sendMessages() in the LIFF API
   *            reference.
   */
  type: 'external' | 'line';
  /** URL of the image file. Only included when type is external. */
  originalContentUrl?: string;
  /** URL of the preview image. Only included when type is external. */
  previewImageUrl?: string;
};

/**
 * @category Event Mixin
 */
export interface Media {
  readonly contentProvider: MediaContentProvider;
}

/** @internal */
export const Media: Media = {
  get contentProvider() {
    return this.payload.message.contentProvider;
  },
};

/**
 * @category Event Mixin
 */
export interface Playable {
  /** Length of video file (milliseconds). */
  readonly duration: number;
}

/** @internal */
export const Playable: Playable = {
  get duration() {
    return this.payload.message.duration;
  },
};

/**
 * @category Event Mixin
 */
export interface File {
  /** File name. */
  readonly fileName: string;
  /** File size in bytes. */
  readonly fileSize: number;
}

/** @internal */
export const File: File = {
  get fileName() {
    return this.payload.message.fileName;
  },

  get fileSize() {
    return this.payload.message.fileSize;
  },
};

/**
 * @category Event Mixin
 */
export interface Location {
  readonly title: string;
  readonly address: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** @internal */
export const Location: Location = {
  get title() {
    return this.payload.message.title;
  },

  get address() {
    return this.payload.message.address;
  },

  get latitude() {
    return this.payload.message.latitude;
  },

  get longitude() {
    return this.payload.message.longitude;
  },
};

/**
 * @category Event Mixin
 */
export interface Sticker {
  readonly packageId: string;
  readonly stickerId: string;
  readonly stickerResourceType:
    | 'STATIC'
    | 'ANIMATION'
    | 'SOUND'
    | 'ANIMATION_SOUND'
    | 'POPUP'
    | 'POPUP_SOUND'
    | 'NAME_TEXT'
    | 'PER_STICKER_TEXT';
}

/** @internal */
export const Sticker: Sticker = {
  get packageId() {
    return this.payload.message.packageId;
  },

  get stickerId() {
    return this.payload.message.stickerId;
  },

  get stickerResourceType() {
    return this.payload.message.stickerResourceType;
  },
};

/** @internal */
export const Unsend: Message = {
  get messageId() {
    return this.payload.unsend.messageId;
  },
};

/**
 * @category Event Mixin
 */
export interface Members {
  /** User sources affected by the event */
  readonly members: UserSource[];
}

/** @internal */
export const MemberJoined: Members = {
  get members() {
    return this.payload.joined.members;
  },
};

/** @internal */
export const MemberLeft: Members = {
  get members() {
    return this.payload.left.members;
  },
};

/**
 * @category Event Mixin
 */
export interface Postback {
  /** Postback data. */
  readonly data: string;
}

/** @internal */
export const Postback: Postback = {
  get data() {
    return this.payload.postback.data;
  },
};

/**
 * @category Event Mixin
 */
export interface DateParam {
  /** Date selected by user. `full-date` format. */
  readonly date: string;
}

/** @internal */
export const DateParam: DateParam = {
  get date() {
    return this.payload.postback.params.date;
  },
};

/**
 * @category Event Mixin
 */
export interface TimeParam {
  /** Time selected by user. `time-hour ":" time-minute` format. */
  readonly time: string;
}

/** @internal */
export const TimeParam: TimeParam = {
  get time() {
    return this.payload.postback.params.time;
  },
};

/**
 * @category Event Mixin
 */
export interface DatetimeParam {
  /**
   * Date and time selected by user. `full-date "T" time-hour ":" time-minute`
   * format.
   */
  readonly datetime: string;
}

/** @internal */
export const DatetimeParam: DatetimeParam = {
  get datetime() {
    return this.payload.postback.params.datetime;
  },
};

/**
 * @category Event Mixin
 */
export interface Beacon {
  /** Hardware ID of the beacon that was detected */
  readonly hwid: string;
  /** Type of beacon event. */
  readonly actionType: string;
  /** Device message of beacon that was detected. This message consists of data
   * generated by the beacon to send notifications to bot servers. Only included
   * in webhook events from devices that support the "device message" property.
   */
  readonly deviceMessage: string;
}

/** @internal */
export const Beacon: Beacon = {
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

/**
 * @category Event Mixin
 */
export interface AccountLink {
  /** Indicate whether the link was successful or not. */
  readonly result: 'ok' | 'failed';
  /** Specified nonce when verifying the user ID. */
  readonly nonce: string;
}

/** @internal */
export const AccountLink: AccountLink = {
  get result() {
    return this.payload.link.result;
  },

  get nonce() {
    return this.payload.link.nonce;
  },
};

/**
 * @category Event Mixin
 */
export interface DeviceLink {
  /** Device ID of the device that has been linked with LINE. */
  readonly deviceId: string;
}

/** @internal */
export const DeviceLink: DeviceLink = {
  get deviceId() {
    return this.payload.things.deviceId;
  },
};

/**
 * @category Event Mixin
 */
export interface ThingsScenarioExecution {
  /** Scenario ID executed. */
  readonly scenarioId: string;
  /** Revision number of the scenario set containing the executed scenario */
  readonly revision: number;
  /** Timestamp for when execution of scenario action started (milliseconds, LINE app time) */
  readonly startTime: number;
  /** Timestamp for when execution of scenario was completed (milliseconds, LINE app time) */
  readonly endTime: number;
  /** Scenario execution completion status */
  readonly resultCode: 'success' | 'gatt_error' | 'runtime_error';
  /**
   * Data contained in notification. The value is Base64-encoded binary data.
   * Only included for scenarios where trigger.type = BLE_NOTIFICATION.
   */
  readonly bleNotificationPayload: 'AQ==';
  /** Execution result of individual operations specified in action */
  readonly actionResults: { type: string; data: string }[];
  readonly errorReason?: string;
}

/** @internal */
export const ThingsScenarioExecution: ThingsScenarioExecution = {
  get scenarioId() {
    return this.payload.things.result.scenarioId;
  },

  get revision() {
    return this.payload.things.result.revision;
  },

  get startTime() {
    return this.payload.things.result.startTime;
  },

  get endTime() {
    return this.payload.things.result.endTime;
  },

  get resultCode() {
    return this.payload.things.result.resultCode;
  },

  get bleNotificationPayload() {
    return this.payload.things.result.bleNotificationPayload;
  },

  get actionResults() {
    return this.payload.things.result.actionResults;
  },

  get errorReason() {
    return this.payload.things.result.errorReason;
  },
};
