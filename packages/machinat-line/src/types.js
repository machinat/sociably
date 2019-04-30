// @flow
import type {
  ContainerNativeType,
  SegmentNativeType,
} from 'machinat-renderer/types';
import type { BotPlugin, MachinatEvent } from 'machinat-base/types';
import type { WebhookResponse } from 'machinat-webhook-receiver/types';

import type LineThread from './thread';

type UserSource = {|
  type: 'user',
  userId: string,
|};

type GroupSource = {|
  type: 'group',
  userId: string,
  groupId: string,
|};

type RoomSource = {|
  type: 'room',
  userId: string,
  roomId: string,
|};

export type LineSource = UserSource | GroupSource | RoomSource;

// TODO: type the complete raw event object
export type LineRawEvent = {
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
};

export type LineEvent = {
  platform: 'line',
  type: string,
  subtype: void | string,
  thread: LineThread,
  shouldRespond: boolean,
  payload: LineRawEvent,
};

declare var e: LineEvent;
(e: MachinatEvent<LineRawEvent, LineThread>);

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
  baseSize: {
    width: 1040,
    height: number,
  },
  video: {
    originalContentUrl: string,
    previewImageUrl: string,
    area: {
      x: number,
      y: number,
      width: number,
      height: number,
    },
    externalLink: string,
    label: string,
  },
  actions: Object[], // TODO: type the imagemap action object
} & QuickRepliable;

export type TemplateSegmentValue = {
  type: 'template',
  altText: string,
  template: Object, // TODO: type the template object
} & QuickRepliable;

export type LinkRichMenuSegmentValue = { id: string };
export type LeaveSegmentValue = {};

export type MessageSegmentValue =
  | TextSegmentValue
  | StickerSegmentValue
  | ImageSegmentValue
  | VideoSegmentValue
  | AudioSegmentValue
  | LocationSegmentValue
  | ImagemapSegmentValue
  | TemplateSegmentValue;

export type LineSegmentValue =
  | MessageSegmentValue
  | LinkRichMenuSegmentValue
  | LeaveSegmentValue;

export type LineContainerNativeType = ContainerNativeType<LineSegmentValue>;

export type LineMessageNativeType = SegmentNativeType<MessageSegmentValue>;

export type LineNonMessageNativeType = SegmentNativeType<
  LinkRichMenuSegmentValue | LeaveSegmentValue
> & {
  $$entry: <Value>(thread: LineThread, rendered: Value) => string,
};

export type LineComponent =
  | LineContainerNativeType
  | LineMessageNativeType
  | LineNonMessageNativeType;

type MessagesBodyWithoutTarget = {|
  messages: LineSegmentValue[],
|};

type ReplyRequestBody = {|
  replyToken: string,
  ...MessagesBodyWithoutTarget,
|};

type PushRequestBody = {|
  to: string,
  ...MessagesBodyWithoutTarget,
|};

type MulticastRequestBody = {|
  to: string[],
  ...MessagesBodyWithoutTarget,
|};

export type LineMessageRequestBody =
  | ReplyRequestBody
  | PushRequestBody
  | MulticastRequestBody;

export type LineJob = {
  body: void | LineMessageRequestBody | Object,
  entry: string,
  threadUid?: string,
};

export type LineAPIResult = {};

export type LineBotOptions = {
  channelSecret?: string,
  shouldValidateRequest: boolean,
  accessToken: string,
  connectionCapicity: number,
  plugins?: BotPlugin<
    LineThread,
    LineEvent,
    LineSegmentValue,
    LineComponent,
    WebhookResponse,
    LineJob,
    LineAPIResult
  >[],
};

export type LineSendOptions = {
  replyToken?: string,
};
