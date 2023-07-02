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
import { LineBot } from './Bot.js';
import type LineChat from './Chat.js';
import type { AgentSettingsAccessorI } from './interface.js';
import type { LineEvent, LineRawEvent } from './event/types.js';

export * from './event/types.js';

export type UserSource = {
  type: 'user';
  userId: string;
};

export type GroupSource = {
  type: 'group';
  userId: string;
  groupId: string;
};

export type RoomSource = {
  type: 'room';
  userId: string;
  roomId: string;
};

export type LineSource = UserSource | GroupSource | RoomSource;

export type LineRawUserProfile = {
  displayName: string;
  userId: string;
  language?: string;
  pictureUrl?: string;
  statusMessage?: string;
};

export type LineEventContext = {
  platform: 'line';
  event: LineEvent;
  metadata: WebhookMetadata;
  bot: LineBot;
  reply(message: SociablyNode): Promise<null | LineDispatchResponse>;
};

export type LineWebhookRequestBody = {
  destination: string;
  events: LineRawEvent[];
};

export type QuickRepliable = {
  quickReply?: {
    // TODO: type the action object
    items: {
      type: 'action';
      imageUrl: string;
      action: any;
    }[];
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
  baseSize: {
    width: 1040;
    height: number;
  };
  video: {
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
  Segment extends IntermediateSegment<LineSegmentValue> = IntermediateSegment<LineSegmentValue>
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

export type LineChatChannelSettings = {
  /** The provider ID of the business  */
  providerId: string;
  /** The ID of the messaging channel */
  channelId: string;
  /** The secret of the messaging channel */
  channelSecret: string;
  /** The access token of the messaging channel */
  accessToken: string;
  /**
   * The bot user ID of the messaging channel. It can be retrieved through
   * https://api.line.me/v2/bot/info API
   */
  botUserId: string;
  liff?: { default: string };
};

export type LineLoginChannelSettings = {
  /** The provider ID of the business  */
  providerId: string;
  /** The ID of the login channel */
  channelId: string;
  liffIds: string[];
  refChatChannelIds: string[];
};

export type LineProviderSettings = {
  /** The provider ID of the business  */
  providerId: string;
  channels: Omit<LineChatChannelSettings, 'providerId'>[];
  fallbackLiff?: string;
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
  /** The LIFF app id. This is required when using webview */
  liffId?: string;
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
