import type {
  NativeComponent,
  EventMiddleware,
  DispatchMiddleware,
  PlatformMounter,
} from '@machinat/core/types';
import type {
  DispatchFrame,
  DispatchResponse,
} from '@machinat/core/engine/types';
import type { ServiceContainer } from '@machinat/core/service/types';
import type { IntermediateSegment } from '@machinat/core/renderer/types';
import type { WebhookMetadata } from '@machinat/http/webhook/types';
import { LineBot } from './bot';
import type LineChannel from './channel';
import type { LineEvent, LineRawEvent } from './event/types';
import type { CHANNEL_REQUEST_GETTER, BULK_REQUEST_GETTER } from './constant';

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

export type FlexSegmentValue = {
  type: 'flex';
  altText: string;
  contents: any;
} & QuickRepliable;

export type DynamicAPICallGettable = {
  [BULK_REQUEST_GETTER]: (
    ids: string[]
  ) => {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    body: any;
  };
  [CHANNEL_REQUEST_GETTER]: (
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
  | TemplateSegmentValue
  | FlexSegmentValue;

export type LineSegmentValue = LineMessageSegmentValue | DynamicAPICallGettable;

export type LineComponent<
  Props,
  Segment extends IntermediateSegment<LineSegmentValue> = IntermediateSegment<
    LineSegmentValue
  >
> = NativeComponent<Props, Segment>;

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
  executionKey: undefined | string;
};

export type LineAPIResult = {
  code: number;
  headers: Record<string, string>;
  body: any;
};

export type LineDispatchResponse = DispatchResponse<LineJob, LineAPIResult>;

export type LineDispatchFrame = DispatchFrame<LineChannel, LineJob, LineBot>;

export type LineEventMiddleware = EventMiddleware<LineEventContext, null>;
export type LineDispatchMiddleware = DispatchMiddleware<
  LineJob,
  LineDispatchFrame,
  LineAPIResult
>;

export type LinePlatformConfigs = {
  entryPath?: string;
  providerId: string;
  channelId: string;
  channelSecret?: string;
  shouldValidateRequest?: boolean;
  accessToken: string;
  connectionCapicity?: number;
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
