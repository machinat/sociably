// @flow
import type {
  ContainerNativeType,
  ValuesNativeType,
} from 'machinat-renderer/types';
import type { BotPlugin } from 'machinat-base/types';
import type { WebhookResponse } from 'machinat-webhook/types';

import type { ChatThread, MulticastThread } from './thread';

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

// TODO: type all the events
export type LineEvent = {
  platform: 'line',
  type: string,
  subtype: void | string,
  thread: ChatThread,
  shouldRespond: boolean,
  raw: LineRawEvent,
  _useReplyAPI: boolean,
};

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

export type TextActionValue = {
  type: 'text',
  text: string,
} & QuickRepliable;

export type StickerActionValue = {
  type: 'sticker',
  packageId: string,
  stickerId: string,
} & QuickRepliable;

export type ImageActionValue = {
  type: 'image',
  originalContentUrl: string,
  previewImageUrl: string,
} & QuickRepliable;

export type VideoActionValue = {
  type: 'video',
  originalContentUrl: string,
  previewImageUrl: string,
} & QuickRepliable;

export type AudioActionValue = {
  type: 'audio',
  originalContentUrl: string,
  duration: number,
} & QuickRepliable;

export type LocationActionValue = {
  type: 'location',
  title: string,
  address: string,
  latitude: number,
  longitude: number,
} & QuickRepliable;

export type ImagemapActionValue = {
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

export type TemplateActionValue = {
  type: 'template',
  altText: string,
  template: Object, // TODO: type the template object
} & QuickRepliable;

export type LinkRichMenuActionValue = { id: string };
export type LeaveActionValue = {};

export type MessageActionValue =
  | TextActionValue
  | StickerActionValue
  | ImageActionValue
  | VideoActionValue
  | AudioActionValue
  | LocationActionValue
  | ImagemapActionValue
  | TemplateActionValue;

export type LineActionValue =
  | MessageActionValue
  | LinkRichMenuActionValue
  | LeaveActionValue;

type LineComponentExtraAttr = {
  $$hasBody: boolean,
  $$entry: <Value>(thread: ChatThread, rendered: Value) => string,
};

export type LineContainerNativeType = ContainerNativeType<LineActionValue>;

export type LineMessageNativeType = ValuesNativeType<MessageActionValue>;

export type LineNonMessageNativeType = ValuesNativeType<
  LinkRichMenuActionValue | LeaveActionValue
> &
  LineComponentExtraAttr;

export type LineComponent =
  | LineContainerNativeType
  | LineMessageNativeType
  | LineNonMessageNativeType;

type MessagesBodyWithoutTarget = {|
  messages: LineActionValue[],
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

export type LineAPIRequestBody =
  | ReplyRequestBody
  | PushRequestBody
  | MulticastRequestBody;

export type LineJob = {
  body: void | LineAPIRequestBody,
  entry: string,
  threadId: string,
};

export type LineAPIResult = {};

export type LineBotOptions = {
  channelSecret?: string,
  shouldValidateRequest: boolean,
  accessToken: string,
  useReplyAPI: boolean,
  connectionCapicity: number,
  plugins?: BotPlugin<
    LineRawEvent,
    WebhookResponse,
    LineActionValue,
    LineComponent,
    LineJob,
    LineAPIResult,
    ChatThread | MulticastThread,
    ChatThread
  >[],
};
