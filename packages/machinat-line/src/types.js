// @flow
import type {
  ContainerNativeType,
  ValuesNativeType,
} from 'machinat-renderer/types';

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

export type LineContainerNativeType = ContainerNativeType<LineActionValue>;

export type LineMessageNativeType = ValuesNativeType<MessageActionValue>;

export type LineNonMessageNativeType = ValuesNativeType<
  LinkRichMenuActionValue | LeaveActionValue
> & {
  $$hasBody: boolean,
  $$entry: <Value>(thread: LineThread, action: Value) => string,
};

export type LineComponent =
  | LineContainerNativeType
  | LineMessageNativeType
  | LineNonMessageNativeType;

export type LineSendOpions = {
  replyToken?: string,
};

type ReplyRequestBody = {
  replyToken: string,
  messages: LineActionValue[],
};

type PushRequestBody = {
  to: string,
  messages: LineActionValue[],
};

export type LineRequestBody = ReplyRequestBody | PushRequestBody;

export type LineJob = {
  body: void | LineRequestBody,
  apiEntry: string,
  hasBody: boolean,
  threadId: string,
};

export type LineJobResult = {};

export type LineBotOptions = {
  channelSecret?: string,
  shouldValidateRequest: boolean,
  accessToken: string,
  useReplyAPI: boolean,
  connectionCapicity: number,
};
