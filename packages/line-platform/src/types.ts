import type {
  NativeComponent,
  EventMiddleware,
  DispatchMiddleware,
  PlatformUtilities,
  SociablyNode,
} from '@sociably/core';
import type { DispatchFrame, DispatchResponse } from '@sociably/core/engine';
import type { Interfaceable, MaybeContainer } from '@sociably/core/service';
import type { IntermediateSegment } from '@sociably/core/renderer';
import type { WebhookMetadata } from '@sociably/http/webhook';
import { LineSender } from './Sender.js';
import type LineChat from './Chat.js';
import type { AgentSettingsAccessorI } from './interface.js';
import type { LineEvent } from './event/events.js';

export * from './event/events.js';

export type UserSource = {
  type: 'user';
  userId: string;
};

export type GroupSource = {
  type: 'group';
  userId?: string;
  groupId: string;
};

export type RoomSource = {
  type: 'room';
  userId: string;
  roomId: string;
};

export type LineSource = UserSource | GroupSource | RoomSource;

export type LineEventContext = {
  platform: 'line';
  event: LineEvent;
  metadata: WebhookMetadata;
  sender: LineSender;
  reply(message: SociablyNode): Promise<null | LineDispatchResponse>;
};

export type LineWebhookRequestBody = {
  destination: string;
  events: LineRawEvent[];
};

export type QuickReplyPartValue = {
  type: 'action';
  imageUrl: string;
  action: any;
};

export type QuickRepliable = {
  quickReply?: {
    items: QuickReplyPartValue[];
  };
};

export type TextMessageParams = {
  type: 'text';
  text: string;
} & QuickRepliable;

export type StickerMessageParams = {
  type: 'sticker';
  packageId: string;
  stickerId: string;
} & QuickRepliable;

export type ImageMessageParams = {
  type: 'image';
  originalContentUrl: string;
  previewImageUrl: string;
} & QuickRepliable;

export type VideoMessageParams = {
  type: 'video';
  originalContentUrl: string;
  previewImageUrl: string;
} & QuickRepliable;

export type AudioMessageParams = {
  type: 'audio';
  originalContentUrl: string;
  duration: number;
} & QuickRepliable;

export type LocationMessageParams = {
  type: 'location';
  title: string;
  address: string;
  latitude: number;
  longitude: number;
} & QuickRepliable;

export type ImagemapMessageParams = {
  type: 'imagemap';
  altText: string;
  baseUrl: string;
  baseSize: {
    width: 1040;
    height: number;
  };
  video?: {
    originalContentUrl: string;
    previewImageUrl: string;
    area: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    externalLink: string;
    label: string;
  };
  actions: any[]; // TODO: type the imagemap action object
} & QuickRepliable;

export type TemplateMessageParams = {
  type: 'template';
  altText: string;
  template: any; // TODO: type the template object
} & QuickRepliable;

export type FlexMessageParams = {
  type: 'flex';
  altText: string;
  contents: any;
} & QuickRepliable;

export type MessageParams =
  | TextMessageParams
  | StickerMessageParams
  | ImageMessageParams
  | VideoMessageParams
  | AudioMessageParams
  | LocationMessageParams
  | ImagemapMessageParams
  | TemplateMessageParams
  | FlexMessageParams;

export type MessageSegmentValue = {
  type: 'message';
  params: MessageParams;
};

export type ChatActionSegmentValue = {
  type: 'chat_action';
  getChatRequest:
    | null
    | ((thread: LineChat) => {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        url: string;
        params: null | Record<string, unknown>;
      });
  getBulkRequest:
    | null
    | ((ids: string[]) => {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        url: string;
        params: null | Record<string, unknown>;
      });
};

export type LineSegmentValue = MessageSegmentValue | ChatActionSegmentValue;

export type LineComponent<
  Props,
  Segment extends
    IntermediateSegment<LineSegmentValue> = IntermediateSegment<LineSegmentValue>,
> = NativeComponent<Props, Segment>;

type ReplyRequestBody = {
  replyToken: string;
  messages: MessageParams[];
};

type PushRequestBody = {
  to: string;
  messages: MessageParams[];
};

type MulticastRequestBody = {
  to: string[];
  messages: MessageParams[];
};

export type LineMessageRequestBody =
  | ReplyRequestBody
  | PushRequestBody
  | MulticastRequestBody;

export type LineJob = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  params: null | LineMessageRequestBody | unknown;
  chatChannelId: undefined | string;
  accessToken: undefined | string;
  key: undefined | string;
};

export type MessagingApiResult = Record<string, any>;

export type FailMessagingApiResult = {
  message: string;
  details: { message?: string; property?: string }[];
};

export type FailOAuthApiResult = {
  error: string;
  error_description?: string; // eslint-disable-line camelcase
};

export type LineResult = {
  code: number;
  headers: Record<string, string>;
  body: MessagingApiResult;
};

export type LineDispatchResponse = DispatchResponse<LineJob, LineResult>;

export type LineDispatchFrame = DispatchFrame<null | LineChat, LineJob>;

export type LineEventMiddleware = EventMiddleware<LineEventContext, null>;
export type LineDispatchMiddleware = DispatchMiddleware<
  LineJob,
  LineDispatchFrame,
  LineResult
>;

export type LiffAppChoiceSetting = {
  default: string;
  full?: string;
  tall?: string;
  compact?: string;
};

export type LineChatChannelSettings = {
  /** The provider ID of the business */
  providerId: string;
  /** The ID of the messaging channel */
  channelId: string;
  /** The secret of the messaging channel */
  channelSecret: string;
  /** The access token of the messaging channel */
  accessToken: string;
  /**
   * The sender user ID of the messaging channel. It can be retrieved through
   * https://api.line.me/v2/bot/info API
   */
  botUserId: string;
  liffApps?: LiffAppChoiceSetting;
  /** Whether if the messaging channel is linked with the login channel */
  isLinkedWithLoginChannel?: boolean;
};

export type LineLoginChannelSettings = {
  /** The provider ID of the business */
  providerId: string;
  /** The ID of the login channel */
  channelId: string;
  liffIds: string[];
  refChatChannelIds: string[];
  /** The messaging API channel id linked with the login channel */
  linkedChatChannelId?: string;
};

export type LineProviderSettings = {
  /** The provider ID of the business */
  providerId: string;
  channels: Omit<LineChatChannelSettings, 'providerId'>[];
  fallbackLiffApps?: LiffAppChoiceSetting;
};

export type LineConfigs = {
  agentSettings?: Omit<LineChatChannelSettings, 'botUserId'>;
  multiAgentSettings?: LineProviderSettings[];
  agentSettingsService?: Interfaceable<AgentSettingsAccessorI>;
  /** The webhook path to receive events. Default to `.` */
  webhookPath?: string;
  /** To verify the webhook request by the signature or not. Default to `true` */
  shouldVerifyRequest?: boolean;
  /** The max API request connections at the same time */
  maxRequestConnections?: number;
  eventMiddlewares?: MaybeContainer<LineEventMiddleware>[];
  dispatchMiddlewares?: MaybeContainer<LineDispatchMiddleware>[];
};

export type LinePlatformUtilities = PlatformUtilities<
  LineEventContext,
  null,
  LineJob,
  LineDispatchFrame,
  LineResult
>;

export type LineRawUserProfile = {
  displayName: string;
  userId: string;
  language?: string;
  pictureUrl?: string;
  statusMessage?: string;
};

// Message-related types
export type LineRawMessageBase = {
  /** Message ID */
  id: string;
  /** Message type identifier */
  type: string;
  /** Quote token of the message. Used to get quote tokens for message quoting. */
  quoteToken?: string;
  /** Read token that allows marking messages as read. Has no expiration date. */
  markAsReadToken?: string;
};

export type LineRawTextMessage = LineRawMessageBase & {
  type: 'text';
  text: string;
  emojis?: {
    index: number;
    length: number;
    productId: string;
    emojiId: string;
  }[];
  mention?: {
    mentionees: {
      index: number;
      length: number;
      type: 'user' | 'all';
      userId?: string;
      isSelf?: boolean;
    }[];
  };
  quotedMessageId?: string;
};

export type LineRawImageMessage = LineRawMessageBase & {
  type: 'image';
  /** Provider of the image file */
  contentProvider: {
    /**
     * 'line': sent by LINE user (get via Get content endpoint), 'external': URL
     * included (not from LY Corporation server)
     */
    type: 'line' | 'external';
    /** URL of the image file. Only included when type is 'external'. */
    originalContentUrl?: string;
    /** URL of the preview image. Only included when type is 'external'. */
    previewImageUrl?: string;
  };
  /**
   * Image set information. Only included when multiple images are sent
   * simultaneously.
   */
  imageSet?: {
    /** Image set ID */
    id: string;
    /**
     * Index starting from 1, indicating the image number in a set of images
     * sent simultaneously
     */
    index: number;
    /** The total number of images sent simultaneously */
    total: number;
  };
};

export type LineRawVideoMessage = LineRawMessageBase & {
  type: 'video';
  /** Length of video file in milliseconds */
  duration?: number;
  /** Provider of the video file */
  contentProvider: {
    /**
     * 'line': sent by LINE user (get via Get content endpoint), 'external': URL
     * included (not from LY Corporation server)
     */
    type: 'line' | 'external';
    /** URL of the video file. Only included when type is 'external'. */
    originalContentUrl?: string;
    /** URL of the preview image. Only included when type is 'external'. */
    previewImageUrl?: string;
  };
};

export type LineRawAudioMessage = LineRawMessageBase & {
  type: 'audio';
  /** Length of audio file in milliseconds */
  duration?: number;
  /** Provider of the audio file */
  contentProvider: {
    /**
     * 'line': sent by LINE user (get via Get content endpoint), 'external': URL
     * included (not from LY Corporation server)
     */
    type: 'line' | 'external';
    /** URL of the audio file. Only included when type is 'external'. */
    originalContentUrl?: string;
  };
};

export type LineRawMediaMessage =
  | LineRawImageMessage
  | LineRawVideoMessage
  | LineRawAudioMessage;

export type LineRawFileMessage = LineRawMessageBase & {
  type: 'file';
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
};

export type LineRawLocationMessage = LineRawMessageBase & {
  type: 'location';
  /** Title of the location */
  title?: string;
  /** Address of the location */
  address?: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
};

export type LineRawStickerMessage = LineRawMessageBase & {
  type: 'sticker';
  /** Package ID */
  packageId: string;
  /** Sticker ID */
  stickerId: string;
  /**
   * Sticker resource type: STATIC, ANIMATION, SOUND, ANIMATION_SOUND, POPUP,
   * POPUP_SOUND, CUSTOM, MESSAGE, NAME_TEXT, PER_STICKER_TEXT
   */
  stickerResourceType: string;
  /**
   * Array of up to 15 keywords describing the sticker. Random selection of 15
   * if sticker has 16 or more keywords.
   */
  keywords?: string[];
  /**
   * Any text entered by the user. Only included for message stickers. Max 100
   * characters.
   */
  text?: string;
  /**
   * Message ID of a quoted message. Only included when the received message
   * quotes a past message.
   */
  quotedMessageId?: string;
};

export type LineRawMessage =
  | LineRawTextMessage
  | LineRawImageMessage
  | LineRawVideoMessage
  | LineRawAudioMessage
  | LineRawFileMessage
  | LineRawLocationMessage
  | LineRawStickerMessage;

// Event-specific payload types
export type LineRawPostbackData = {
  data: string;
  params?: {
    // Date-time selection action params
    date?: string;
    time?: string;
    datetime?: string;
    // Rich menu switch action params
    newRichMenuAliasId?: string;
    status?:
      | 'SUCCESS'
      | 'RICHMENU_ALIAS_ID_NOTFOUND'
      | 'RICHMENU_NOTFOUND'
      | 'FAILED';
  };
};

export type LineRawBeaconData = {
  /** Hardware ID of the beacon that was detected */
  hwid: string;
  /**
   * Type of beacon event: 'enter' (entered range), 'banner' (tapped banner),
   * 'stay' (within range, sent every 10+ seconds)
   */
  type: 'enter' | 'banner' | 'stay';
  /**
   * Device message of beacon. Data generated by beacon to send notifications to
   * sender servers. Only for devices supporting device message property.
   */
  dm?: string;
};

export type LineRawAccountLinkData = {
  /**
   * Whether linking the account was successful: 'ok' (successful) or 'failed'
   * (failed for any reason, such as user impersonation)
   */
  result: 'ok' | 'failed';
  /**
   * Specified nonce (number used once) when verifying the user ID during
   * account linking
   */
  nonce: string;
};

export type LineRawUnsendData = {
  /** The message ID of the unsent message */
  messageId: string;
};

export type LineRawFollowData = {
  /**
   * Whether the user unblocked the LINE Official Account (true) or added as
   * friend (false). Note: doesn't guarantee complete accuracy.
   */
  isUnblocked: boolean;
};

export type LineRawMemberData = {
  members: UserSource[];
};

export type LineRawVideoPlayCompleteData = {
  /**
   * ID used to identify a video. Same value as trackingId assigned to the video
   * message.
   */
  trackingId: string;
};

export type LineRawMembershipData = {
  /**
   * Type of membership event: 'joined' (user joined), 'left' (user left),
   * 'renewed' (user renewed)
   */
  type: 'joined' | 'left' | 'renewed';
  /** Membership ID that the user has joined, left, or renewed */
  membershipId: number;
};

export type LineRawThingsData = {
  /** Device ID for LINE Things events */
  deviceId?: string;
  /** Type of LINE Things event */
  type?: string;
  /** Allow additional properties for Things events */
  [key: string]: any;
};

export type LineRawEvent = {
  /** Identifier for the type of event */
  type: string;
  /**
   * Channel state: 'active' (channel is active, can send reply/push messages)
   * or 'standby' (channel is waiting, no reply token for reply messages). When
   * standby, sender shouldn't send messages as module may be handling the
   * interaction.
   */
  mode?: 'active' | 'standby';
  /**
   * UNIX time of the event occurred (in milliseconds). Represents time event
   * occurred, not redelivery time. Check timestamp if webhook redelivery is
   * enabled to handle order differences.
   */
  timestamp: number;
  /**
   * Source user, group chat, or multi-person chat object with information about
   * the source of the event. Not always included. Won't be included in account
   * link event if linking failed.
   */
  source?: LineSource;
  /**
   * Webhook Event ID. An ID that uniquely identifies a webhook event. This is a
   * string in ULID format.
   */
  webhookEventId: string;
  /** Delivery context information about webhook delivery */
  deliveryContext?: {
    /**
     * Whether the webhook event is a redelivered one (true) or first webhook
     * event sent (false)
     */
    isRedelivery: boolean;
  };

  /**
   * Reply token used to send reply message to this event. Present for events
   * that can be replied to.
   */
  replyToken?: string;

  // Event-specific properties - these are optional and type depends on event type
  /**
   * Message object containing message contents for message events. Types: text,
   * image, video, audio, file, location, sticker.
   */
  message?: LineRawMessage;
  /** Postback data for postback events triggered by postback actions */
  postback?: LineRawPostbackData;
  /** Beacon data for beacon events when user enters LINE Beacon range */
  beacon?: LineRawBeaconData;
  /**
   * Account link data for account link events when user links LINE account with
   * provider service
   */
  link?: LineRawAccountLinkData;
  /** Unsend data for unsend events when user unsends a sent message */
  unsend?: LineRawUnsendData;
  /**
   * Follow data for follow events when LINE Official Account is added as friend
   * or unblocked
   */
  follow?: LineRawFollowData;
  /**
   * Member join data for memberJoined events when user joins group/multi-person
   * chat with LINE Official Account
   */
  joined?: LineRawMemberData;
  /**
   * Member left data for memberLeft events when user leaves group/multi-person
   * chat with LINE Official Account
   */
  left?: LineRawMemberData;
  /**
   * Video play complete data for videoPlayComplete events when user finishes
   * viewing video with trackingId
   */
  videoPlayComplete?: LineRawVideoPlayCompleteData;
  /**
   * Membership data for membership events when user joins, leaves, or renews
   * membership
   */
  membership?: LineRawMembershipData;
};
