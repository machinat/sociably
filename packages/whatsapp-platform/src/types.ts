import type {
  NativeComponent,
  EventMiddleware,
  DispatchMiddleware,
  PlatformUtilities,
  SociablyNode,
} from '@sociably/core';
import type { DispatchFrame } from '@sociably/core/engine';
import type { MaybeContainer, Interfaceable } from '@sociably/core/service';
import type { IntermediateSegment } from '@sociably/core/renderer';
import type { WebhookMetadata } from '@sociably/http/webhook';
import type {
  MetaApiJob,
  MetaApiResult,
  MetaApiDispatchResponse,
  MetaApiUploadingFile,
} from '@sociably/meta-api';
import type { WhatsAppBot } from './Bot.js';
import type WhatsAppChat from './Chat.js';
import type { AgentSettingsAccessorI } from './interface.js';
import type { WhatsAppEvent } from './event/events.js';

export * from './event/events.js';

export type WhatsAppSegmentValue = {
  message:
    | Omit<CreateMessageData, 'to' | 'messaging_product'>
    | ReadMessageData;
  file?: MetaApiUploadingFile & {
    contentType: string;
  };
  assetTag?: string;
};

export type WhatsAppComponent<
  Props,
  Segment extends
    IntermediateSegment<WhatsAppSegmentValue> = IntermediateSegment<WhatsAppSegmentValue>,
> = NativeComponent<Props, Segment>;

export type WhatsAppEventContext = {
  platform: 'whatsapp';
  event: WhatsAppEvent;
  metadata: WebhookMetadata;
  bot: WhatsAppBot;
  reply(message: SociablyNode): Promise<null | MetaApiDispatchResponse>;
};

export type WhatsAppEventMiddleware = EventMiddleware<
  WhatsAppEventContext,
  null
>;

export type WhatsAppDispatchFrame = DispatchFrame<WhatsAppChat, MetaApiJob>;

export type WhatsAppDispatchMiddleware = DispatchMiddleware<
  MetaApiJob,
  WhatsAppDispatchFrame,
  MetaApiResult
>;

export type WhatsAppAgentSettings = {
  /** Complete phone number in E.164 format */
  phoneNumber: string;
  /** Phone number ID */
  numberId: string;
  /** Business account ID that the number belongs to */
  businessAccountId: string;
};

export type WhatsAppBusinessAccountSettings = {
  /** Business account ID that the numbers belongs to */
  businessAccountId: string;
  numbers: {
    /** Phone number ID */
    numberId: string;
    /** Complete phone number. It must include the country code with "+" prefix */
    phoneNumber: string;
  }[];
};

export type WhatsAppConfigs = {
  /** Agent number settings in single agent mode */
  agentSettings?: WhatsAppAgentSettings;
  /** Agent number settings in multi agent mode */
  multiAgentSettings?: WhatsAppBusinessAccountSettings[];
  /** Host number integration settings by your own service */
  agentSettingsService?: Interfaceable<AgentSettingsAccessorI>;
  /** The access token for the app */
  accessToken: string;
  /** The Facebook app ID */
  appId: string;
  /** The Facebook app secret */
  appSecret: string;
  /** To verify the webhook request by the signature or not. Default to `true` */
  shouldVerifyRequest?: boolean;
  /** To handle the webhook challenge request or not. Default to `true` */
  shouldHandleChallenge?: boolean;
  /** The verify token for registering webhook */
  webhookVerifyToken: string;
  /** The webhook path to receive events. Default to `.` */
  webhookPath?: string;
  /**
   * The webhook subscription fields for WhatsApp account. Default to
   * `['messages']`
   */
  subscriptionFields?: string[];
  /** The graph API version to make API calls */
  graphApiVersion?: string;
  apiBatchRequestInterval?: number;
  eventMiddlewares?: MaybeContainer<WhatsAppEventMiddleware>[];
  dispatchMiddlewares?: MaybeContainer<WhatsAppDispatchMiddleware>[];
};

export type WhatsAppPlatformUtilities = PlatformUtilities<
  WhatsAppEventContext,
  null,
  MetaApiJob,
  WhatsAppDispatchFrame,
  MetaApiResult
>;

/* eslint-disable camelcase */

export type UserProfileData = {
  name: string;
};

export type ContactData = {
  wa_id: string;
  profile: UserProfileData;
  identity_key_hash?: string;
};

export type MessageContextData = {
  from?: string;
  id?: string;
  referred_product?: {
    catalog_id: string;
    product_retailer_id: string;
  };
};

export type ReferralData = {
  source_url: string;
  source_type: 'ad' | 'post';
  source_id: string;
  headline: string;
  body: string;
  media_type: 'image' | 'video';
  image_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  ctwa_clid?: string;
};

export type TextMessageData = {
  body: string;
};

export type MediaMessageData = {
  id: string;
  mime_type?: string;
  sha256?: string;
  caption?: string;
  filename?: string;
};

export type InteractiveMessageData = {
  button_reply?: {
    id: string;
    title: string;
  };
  list_reply?: {
    id: string;
    title: string;
    description?: string;
  };
};

export type SystemMessageData = {
  body: string;
  new_wa_id?: string;
  customer?: string;
  wa_id?: string;
  identity?: string;
};

export type ConversationData = {
  id: string;
  origin: {
    type: 'business_initiated' | 'customer_initiated' | 'referral_conversion';
  };
  expiration_timestamp?: string;
};

export type MessageData = {
  from: string;
  id: string;
  timestamp: string;
  type:
    | 'text'
    | 'audio'
    | 'image'
    | 'video'
    | 'document'
    | 'sticker'
    | 'interactive'
    | 'button'
    | 'quick_reply'
    | 'system'
    | 'contacts'
    | 'location'
    | 'unknown'
    | 'unsupported';
  context?: MessageContextData;
  referral?: ReferralData;
  text?: TextMessageData;
  audio?: MediaMessageData;
  image?: MediaMessageData;
  video?: MediaMessageData;
  document?: MediaMessageData;
  sticker?: MediaMessageData;
  interactive?: InteractiveMessageData;
  button?: InteractiveMessageData;
  quick_reply?: {
    payload: string;
    text: string;
  };
  system?: SystemMessageData;
  contacts?: ContactData[];
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  errors?: ErrorData[];
};

export type StatusData = {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: ConversationData;
  pricing?: {
    billable: boolean;
    pricing_model: 'CBP';
    category: string;
  };
  errors?: ErrorData[];
};

export type ErrorData = {
  code: number;
  title: string;
  message?: string;
  error_data?: {
    details: string;
  };
};

export type WhatsAppEventData = {
  messaging_product: 'whatsapp';
  metadata: {
    phone_number_id: string;
    display_phone_number: string;
  };
  contacts?: ContactData[];
  messages?: MessageData[];
  statuses?: StatusData[];
  errors?: ErrorData[];
};

export type WhatsAppRawEvent = {
  object: 'whatsapp_business_account';
  entry: {
    id: string;
    changes: {
      value: WhatsAppEventData;
      field: string;
    }[];
  }[];
};

export type CreateTextMessage = {
  body: string;
  preview_url?: boolean;
};

export type CreateMediaMessage = {
  id?: string;
  link?: string;
  caption?: string;
  filename?: string;
};

export type CreateInteractiveMessage = {
  type: 'button' | 'list' | 'product' | 'product_list';
  body?: {
    text: string;
  };
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    image?: CreateMediaMessage;
    video?: CreateMediaMessage;
    document?: CreateMediaMessage;
  };
  footer?: {
    text: string;
  };
  action: {
    buttons?: {
      type: 'reply';
      reply: {
        id: string;
        title: string;
      };
    }[];
    sections?: {
      title?: string;
      rows: {
        id: string;
        title: string;
        description?: string;
      }[];
    }[];
    catalog_id?: string;
    product_retailer_id?: string;
    sections_list?: {
      product_items: {
        product_retailer_id: string;
      }[];
    }[];
  };
};

export type CreateTemplateMessage = {
  name: string;
  language: {
    code: string;
  };
  components?: {
    type: 'header' | 'body' | 'button';
    parameters?: {
      type:
        | 'text'
        | 'currency'
        | 'date_time'
        | 'image'
        | 'document'
        | 'video'
        | 'location';
      text?: string;
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
      image?: CreateMediaMessage;
      document?: CreateMediaMessage;
      video?: CreateMediaMessage;
      location?: CreateLocationMessage;
    }[];
    sub_type?: 'quick_reply' | 'url' | 'phone_number';
    index?: string;
  }[];
};

export type CreateLocationMessage = {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
};

export type CreateContactMessage = {
  addresses?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    type?: 'HOME' | 'WORK';
  }[];
  birthday?: string;
  emails?: {
    email?: string;
    type?: 'WORK' | 'HOME';
  }[];
  name: {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    suffix?: string;
    prefix?: string;
  };
  org?: {
    company?: string;
    department?: string;
    title?: string;
  };
  phones?: {
    phone?: string;
    wa_id?: string;
    type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK';
  }[];
  urls?: {
    url?: string;
    type?: 'WORK' | 'HOME';
  }[];
};

export type CreateStickerMessage = CreateMediaMessage;

export type CreateMessageData = {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type:
    | 'text'
    | 'audio'
    | 'image'
    | 'video'
    | 'document'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'interactive'
    | 'template'
    | 'reaction';
  text?: CreateTextMessage;
  audio?: CreateMediaMessage;
  image?: CreateMediaMessage;
  video?: CreateMediaMessage;
  document?: CreateMediaMessage;
  sticker?: CreateStickerMessage;
  location?: CreateLocationMessage;
  contacts?: CreateContactMessage[];
  interactive?: CreateInteractiveMessage;
  template?: CreateTemplateMessage;
  reaction?: {
    message_id: string;
    emoji: string;
  };
  biz_opaque_callback_data?: string;
};

export type ReadMessageData = {
  messaging_product: 'whatsapp';
  status: 'read';
  message_id: string;
};
