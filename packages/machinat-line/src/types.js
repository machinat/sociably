// @flow
import type {
  NativeComponent,
  MachinatEvent,
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
import type LineBot from './bot';
import type LineChannel from './channel';
import type { LineUser } from './user';
import typeof {
  CHANNEL_API_CALL_GETTER,
  BULK_API_CALL_GETTER,
} from './constant';

type UserSource = {
  type: 'user',
  userId: string,
};

type GroupSource = {
  type: 'group',
  userId: string,
  groupId: string,
};

type RoomSource = {
  type: 'room',
  userId: string,
  roomId: string,
};

export type LineSource = UserSource | GroupSource | RoomSource;

// TODO: type the complete raw event object
export type LineRawEvent = {|
  type: string,
  timestamp: number,
  source: LineSource,
  replytoken: string,
  message: Object,
  joined: Object,
  left: Object,
  postback: Object,
  beacon: Object,
  link: Object,
  things: Object,
|};

export type LineEvent = {|
  platform: 'line',
  type: string,
  subtype: void | string,
  payload: LineRawEvent,
|};

declare var e: LineEvent;
(e: MachinatEvent<LineRawEvent>);

export type LineEventContext = EventContext<
  LineChannel,
  LineUser,
  LineEvent,
  WebhookMetadata,
  LineBot
>;

export type LineWebhookRequestBody = {|
  destination: string,
  events: LineRawEvent[],
|};

export type QuickRepliable = {
  quickReply?: {
    // TODO: type the action object
    items: { type: 'action', imageUrl: string, action: Object }[],
  },
};

export type TextSegmentValue = {
  type: 'text',
  text: string,
} & QuickRepliable;

export type StickerSegmentValue = {
  type: 'sticker',
  packageId: string,
  stickerId: string,
} & QuickRepliable;

export type ImageSegmentValue = {
  type: 'image',
  originalContentUrl: string,
  previewImageUrl: string,
} & QuickRepliable;

export type VideoSegmentValue = {
  type: 'video',
  originalContentUrl: string,
  previewImageUrl: string,
} & QuickRepliable;

export type AudioSegmentValue = {
  type: 'audio',
  originalContentUrl: string,
  duration: number,
} & QuickRepliable;

export type LocationSegmentValue = {
  type: 'location',
  title: string,
  address: string,
  latitude: number,
  longitude: number,
} & QuickRepliable;

export type ImagemapSegmentValue = {
  type: 'imagemap',
  altText: string,
  address: string,
  baseSize: {|
    width: 1040,
    height: number,
  |},
  video: {|
    originalContentUrl: string,
    previewImageUrl: string,
    area: {|
      x: number,
      y: number,
      width: number,
      height: number,
    |},
    externalLink: string,
    label: string,
  |},
  actions: Object[], // TODO: type the imagemap action object
} & QuickRepliable;

export type TemplateSegmentValue = {
  type: 'template',
  altText: string,
  template: Object, // TODO: type the template object
} & QuickRepliable;

type DynamicAPICallGettable = {
  [BULK_API_CALL_GETTER]: (
    ids: string[]
  ) => {|
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: ?Object,
  |},
  [CHANNEL_API_CALL_GETTER]: (
    channel: LineChannel
  ) => {|
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: ?Object,
  |},
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

type ReplyRequestBody = {|
  replyToken: string,
  messages: LineMessageSegmentValue[],
|};

type PushRequestBody = {|
  to: string,
  messages: LineMessageSegmentValue[],
|};

type MulticastRequestBody = {|
  to: string[],
  messages: LineMessageSegmentValue[],
|};

export type LineMessageRequestBody =
  | ReplyRequestBody
  | PushRequestBody
  | MulticastRequestBody;

export type LineJob = {|
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body: null | LineMessageRequestBody | Object,
  path: string,
  channelUid?: string,
|};

export type LineAPIResult = Object;

export type LineDispatchResponse = DispatchResponse<LineJob, LineAPIResult>;

export type LineDispatchFrame = DispatchFrame<LineChannel, LineJob, LineBot>;

export type LineEventMiddleware = EventMiddleware<LineEventContext, null>;
export type LineDispatchMiddleware = DispatchMiddleware<
  LineJob,
  LineDispatchFrame,
  LineAPIResult
>;

export type LinePlatformConfigs = {
  webhookPath: string,
  channelId: string,
  channelSecret?: string,
  shouldValidateRequest?: boolean,
  accessToken: string,
  connectionCapicity?: number,
  eventMiddlewares?: (
    | LineEventMiddleware
    | ServiceContainer<LineEventMiddleware>
  )[],
  dispatchMiddlewares?: (
    | LineDispatchMiddleware
    | ServiceContainer<LineDispatchMiddleware>
  )[],
};

export type RawLineUserProfile = {
  displayName: string,
  userId: string,
  pictureUrl?: string,
  statusMessage?: string,
};

export type LIFFAuthData = {|
  os: 'ios' | 'android' | 'web',
  language: string,
  version: string,
  isInClient: boolean,
  profile: RawLineUserProfile,
|};

export type LIFFCredential = {|
  accessToken: string,
  os: 'ios' | 'android' | 'web',
  language: string,
  version: string,
  isInClient: boolean,
|};

export type LinePlatformMounter = PlatformMounter<
  LineEventContext,
  null,
  LineJob,
  LineDispatchFrame,
  LineAPIResult
>;
