// @flow
import type { MachinatNativeComponent, MachinatEvent } from 'machinat/types';
import type { BotPlugin } from 'machinat-base/types';
import type { WebhookMetadata } from 'machinat-webhook-receiver/types';
import type LineBot from './bot';
import type LineChannel from './channel';
import type { LineUser } from './user';
import typeof { ENTRY_GETTER } from './constant';

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

export type EntryGetterFn = (
  channel: LineChannel
) => {| method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string |};

export type LinkRichMenuSegmentValue = {|
  id: string,
  [ENTRY_GETTER]: EntryGetterFn,
|};

export type LeaveSegmentValue = {||};

export type LineSegmentValue =
  | TextSegmentValue
  | StickerSegmentValue
  | ImageSegmentValue
  | VideoSegmentValue
  | AudioSegmentValue
  | LocationSegmentValue
  | ImagemapSegmentValue
  | TemplateSegmentValue
  | LinkRichMenuSegmentValue
  | LeaveSegmentValue;

export type LineComponent = MachinatNativeComponent<LineSegmentValue>;

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

export type LineJob = {|
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: LineMessageRequestBody | Object,
  path: string,
  channelUid?: string,
|};

export type LineAPIResult = Object;

export type LineSendOptions = {
  replyToken?: string,
};

export type LineBotPlugin = BotPlugin<
  LineChannel,
  ?LineUser,
  LineEvent,
  WebhookMetadata,
  void,
  LineSegmentValue,
  LineComponent,
  LineJob,
  LineAPIResult,
  LineSendOptions,
  LineBot
>;

export type LineBotOptions = {
  channelId: string,
  channelSecret?: string,
  shouldValidateRequest: boolean,
  accessToken: string,
  connectionCapicity: number,
  plugins?: LineBotPlugin[],
};
