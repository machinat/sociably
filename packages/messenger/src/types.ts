/* eslint-disable camelcase */
import type {
  NativeComponent,
  SociablyNode,
  SociablyThread,
  SociablyUser,
} from '@sociably/core';
import type { IntermediateSegment } from '@sociably/core/renderer';
import type {
  MetaApiUploadingFile,
  MetaApiChannel,
  MetaApiBot,
} from '@sociably/meta-api';
import type {
  PATH_MESSAGES,
  PATH_PASS_THREAD_CONTROL,
  PATH_TAKE_THREAD_CONTROL,
  PATH_REQUEST_THREAD_CONTROL,
} from './constant.js';

export type PsidTarget = {
  id: string;
};
export type UserRefTarget = {
  user_ref: string;
};
export type PostPrivateReplyTarget = {
  post_id: string;
};
export type CommentPrivateReplyTarget = {
  comment_id: string;
};

export type MessagingTarget =
  | PsidTarget
  | UserRefTarget
  | PostPrivateReplyTarget
  | CommentPrivateReplyTarget;

// TODO: type the raw event object
export type MessengerRawEvent = any;

// TODO: detailed message type
export type RawMessage = any;

export type MessagingType = 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
export type NotificationType = 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH';
export type MessageTags =
  | 'CONFIRMED_EVENT_UPDATE'
  | 'POST_PURCHASE_UPDATE'
  | 'ACCOUNT_UPDATE'
  | 'HUMAN_AGENT';

export type BaseSegmentValue = {
  type: string;
  apiPath: string;
  params: Record<string, unknown>;
  file?: MetaApiUploadingFile;
  assetTag?: string;
};

export type MessageValue = {
  type: 'message';
  apiPath: typeof PATH_MESSAGES;
  params: {
    message: RawMessage;
    messaging_type?: MessagingType;
    notification_type?: NotificationType;
    tag?: MessageTags;
    persona_id?: string;
  };
  file?: MetaApiUploadingFile;
  assetTag?: string;
};

export type SenderActionValue = {
  type: 'message';
  apiPath: typeof PATH_MESSAGES;
  params: {
    sender_action: 'mark_seen' | 'typing_on' | 'typing_off';
    persona_id?: string;
  };
};

export type PassThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_PASS_THREAD_CONTROL;
  params: {
    target_app_id: number;
    metadata?: string;
  };
};

export type RequestThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_REQUEST_THREAD_CONTROL;
  params: {
    metadata?: string;
  };
};

export type TakeThreadControlValue = {
  type: 'message';
  apiPath: typeof PATH_TAKE_THREAD_CONTROL;
  params: {
    metadata?: string;
  };
};

export type HandoverProtocolValue =
  | PassThreadControlValue
  | RequestThreadControlValue
  | TakeThreadControlValue;

export type MessengerSegmentValue =
  | MessageValue
  | SenderActionValue
  | HandoverProtocolValue;

export type MessengerIntermediateSegment =
  IntermediateSegment<MessengerSegmentValue>;

export type MessengerComponent<
  Props,
  Segment extends MessengerIntermediateSegment = MessengerIntermediateSegment,
> = NativeComponent<Props, Segment>;

export type MessagingOptions = {
  messagingType?: MessagingType;
  tag?: string;
  notificationType?: NotificationType;
  personaId?: string;
  oneTimeNotifToken?: string;
};

export type MessengerChat = SociablyThread & {
  target: MessagingTarget;
};

export type MessengerUser = SociablyUser & {
  id: string;
};

export type MessengerBot<Channel extends MetaApiChannel> =
  MetaApiBot<Channel> & {
    uploadChatAttachment(
      channel: string | Channel,
      node: SociablyNode,
    ): Promise<null | { attachmentId: string }>;
  };

export type SetSubscribedAppOptions = {
  /** The page object fields to be subscribed */
  fields?: string[];
  /** Specify the access token to be used on the API call */
  accessToken?: string;
};

export type SetMessengerProfileOptions = {
  /** Specify the access token to be used on the API call */
  accessToken?: string;
  /** Specify the platform option */
  platform?: string;
  /**
   * The payload that will be sent as a `messaging_postbacks` event when someone
   * taps the 'get started' button on your Page Messenger welcome screen.
   */
  getStarted?: { payload: string };
  /**
   * An array of locale-specific greeting messages to display on your Page
   * Messenger welcome screen.
   */
  greeting?: { locale: string; text: string }[];
  /** An array with an ice breaker object. */
  iceBreakers?: {
    locale: string;
    callToActions: { question: string; payload: string }[];
  }[];
  /** An array of call-to-action buttons to include in the persistent menu. */
  persistentMenu?: {
    locale: string;
    composerInputDisabled?: boolean;
    callToActions: {
      type: 'postback' | 'web_url';
      title: string;
      payload?: string;
      url?: string;
      webviewHeightRatio?: 'compact' | 'tall' | 'full';
      messengerExtensions?: boolean;
      fallbackUrl?: string;
      webviewShareButton?: 'hide';
    }[];
    disabledSurfaces?: 'customer_chat_plugin'[];
  }[];
  /**
   * A list of whitelisted domains. Required for Pages that use the Messenger
   * Extensions SDK and the checkbox plugin.
   */
  whitelistedDomains?: string[];
  /** Authentication callback URL. Must use https protocol. */
  accountLinkingUrl?: string;
};
