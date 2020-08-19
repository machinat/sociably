import type {
  NativeComponent,
  EventContext,
  EventMiddleware,
  DispatchMiddleware,
  PlatformMounter,
} from '@machinat/core/types';
import type {
  DispatchFrame,
  DispatchResponse,
} from '@machinat/core/engine/types';
import type { ServiceContainer } from '@machinat/core/service/types';
import type { WebhookMetadata } from '@machinat/http/webhook/types';
import { LineBot } from './bot';
import type LineChannel from './channel';
import type LineUser from './user';
import type { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from './constant';

type UserSource = {
  type: 'user';
  userId: string;
};

type GroupSource = {
  type: 'group';
  userId: string;
  groupId: string;
};

type RoomSource = {
  type: 'room';
  userId: string;
  roomId: string;
};

export type LineSource = UserSource | GroupSource | RoomSource;

// TODO: complete type of the raw event
export type LineRawEvent = {
  type: string;
  timestamp: number;
  source: LineSource;
  replytoken: string;
  message: any;
  joined: any;
  left: any;
  postback: any;
  beacon: any;
  link: any;
  things: any;
};

export type LineEvent = {
  platform: 'line';
  type: string;
  subtype: undefined | string;
  payload: LineRawEvent;
};

export type LineEventContext = EventContext<
  LineChannel,
  LineUser,
  LineEvent,
  WebhookMetadata,
  LineBot
>;

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

export type TextSegmentValue = {
  type: 'text';
  text: string;
} & QuickRepliable;

export type StickerSegmentValue = {
  type: 'sticker';
  packageId: string;
  stickerId: string;
} & QuickRepliable;

export type ImageSegmentValue = {
  type: 'image';
  originalContentUrl: string;
  previewImageUrl: string;
} & QuickRepliable;

export type VideoSegmentValue = {
  type: 'video';
  originalContentUrl: string;
  previewImageUrl: string;
} & QuickRepliable;

export type AudioSegmentValue = {
  type: 'audio';
  originalContentUrl: string;
  duration: number;
} & QuickRepliable;

export type LocationSegmentValue = {
  type: 'location';
  title: string;
  address: string;
  latitude: number;
  longitude: number;
} & QuickRepliable;

export type ImagemapSegmentValue = {
  type: 'imagemap';
  altText: string;
  address: string;
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

export type TemplateSegmentValue = {
  type: 'template';
  altText: string;
  template: any; // TODO: type the template object
} & QuickRepliable;

type DynamicAPICallGettable = {
  [BULK_API_CALL_GETTER]: (
    ids: string[]
  ) => {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    body: any;
  };
  [CHANNEL_API_CALL_GETTER]: (
    channel: LineChannel
  ) => {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    body: any;
  };
};

export type LineMessageSegmentValue =
  | TextSegmentValue
  | StickerSegmentValue
  | ImageSegmentValue
  | VideoSegmentValue
  | AudioSegmentValue
  | LocationSegmentValue
  | ImagemapSegmentValue
  | TemplateSegmentValue;

export type LineSegmentValue = LineMessageSegmentValue | DynamicAPICallGettable;

export type LineComponent = NativeComponent<any, LineSegmentValue>;

type ReplyRequestBody = {
  replyToken: string;
  messages: LineMessageSegmentValue[];
};

type PushRequestBody = {
  to: string;
  messages: LineMessageSegmentValue[];
};

type MulticastRequestBody = {
  to: string[];
  messages: LineMessageSegmentValue[];
};

export type LineMessageRequestBody =
  | ReplyRequestBody
  | PushRequestBody
  | MulticastRequestBody;

export type LineJob = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body: null | LineMessageRequestBody | Record<string, unknown>;
  path: string;
  executionKey: void | string;
};

export type LineAPIResult = any;

export type LineDispatchResponse = DispatchResponse<LineJob, LineAPIResult>;

export type LineDispatchFrame = DispatchFrame<LineChannel, LineJob, LineBot>;

export type LineEventMiddleware = EventMiddleware<LineEventContext, null>;
export type LineDispatchMiddleware = DispatchMiddleware<
  LineJob,
  LineDispatchFrame,
  LineAPIResult
>;

export type LinePlatformConfigs = {
  webhookPath?: string;
  providerId: string;
  channelId: string;
  channelSecret?: string;
  shouldValidateRequest?: boolean;
  accessToken: string;
  connectionCapicity?: number;
  profileCacheTime?: number;
  liffChannelIds?: string[];
  noServer?: boolean;
  eventMiddlewares?: (
    | LineEventMiddleware
    | ServiceContainer<LineEventMiddleware>
  )[];
  dispatchMiddlewares?: (
    | LineDispatchMiddleware
    | ServiceContainer<LineDispatchMiddleware>
  )[];
};

export type LinePlatformMounter = PlatformMounter<
  LineEventContext,
  null,
  LineJob,
  LineDispatchFrame,
  LineAPIResult
>;
