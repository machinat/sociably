import { mixin } from '@sociably/core/utils';
import { WHATSAPP } from '../constant.js';
import WhatsAppChat from '../Chat.js';
import WhatsAppUser from '../User.js';
import WhatsAppAgent from '../Agent.js';
import {
  EventBaseMixin,
  MessageMixin,
  UserChangeMixin,
  WithTextMixin,
  StatusMixin,
} from './mixins.js';
import {
  TextEvent,
  AudioEvent,
  ImageEvent,
  DocumentEvent,
  VideoEvent,
  StickerEvent,
  QuickReplyEvent,
  ListInteractiveEvent,
  ButtonInteractiveEvent,
  UserNumberChangeEvent,
  UserIdentityChangeEvent,
  ReferralEvent,
  UnsupportedEvent,
  ReadEvent,
  SentEvent,
  DeliveredEvent,
  FailedEvent,
  ErrorEvent,
  UnknownEvent,
} from './types.js';

const EventBaseProto: EventBaseMixin = {
  platform: WHATSAPP,
  businessAccountId: '',
  agentNumberId: '',
  agentNumberDisplay: '',
  payload: null as never,
  [Symbol.toStringTag]: 'WhatsAppEvent',
};

const MessageProto: MessageMixin = mixin(EventBaseProto, {
  userProfile: null as never,
  get channel() {
    return new WhatsAppAgent(this.agentNumberId);
  },
  get thread() {
    return new WhatsAppChat(this.agentNumberId, this.userNumberId);
  },
  get user() {
    return new WhatsAppUser(this.userNumberId, this.userProfile?.data);
  },
  get messageId() {
    return this.payload.id;
  },
  get userNumberId() {
    return this.payload.from;
  },
  get time() {
    return new Date(this.payload.timestamp);
  },
  get isIdentityAcknowledged() {
    return this.payload.identity?.acknowledged;
  },
  get identityChangeTime() {
    return this.payload.identity?.created_timestamp;
  },
  get identityChangeHash() {
    return this.payload.identity?.hash;
  },
});

const WithTextProto: WithTextMixin = {
  get text() {
    return this.payload.text.body;
  },
};

export const TextProto: TextEvent = mixin(MessageProto, WithTextProto, {
  category: 'message' as const,
  type: 'text' as const,
});

export const AudioProto: AudioEvent = mixin(MessageProto, {
  category: 'message' as const,
  type: 'audio' as const,
  get mediaId() {
    return this.payload.audio.id;
  },
  get mimeType() {
    return this.payload.audio.mime_type;
  },
});

export const ImageProto: ImageEvent = mixin(MessageProto, {
  category: 'message' as const,
  type: 'image' as const,
  get mediaId() {
    return this.payload.image.id;
  },
  get mimeType() {
    return this.payload.image.mime_type;
  },
  get sha256() {
    return this.payload.image.sha256;
  },
  get caption() {
    return this.payload.image.caption;
  },
});

export const StickerProto: StickerEvent = mixin(MessageProto, {
  category: 'message' as const,
  type: 'sticker' as const,
  get mediaId() {
    return this.payload.sticker.id;
  },
  get mimeType() {
    return this.payload.sticker.mime_type;
  },
  get sha256() {
    return this.payload.sticker.sha256;
  },
});

export const DocumentProto: DocumentEvent = mixin(MessageProto, {
  category: 'message' as const,
  type: 'document' as const,
  get mediaId() {
    return this.payload.document.id;
  },
  get mimeType() {
    return this.payload.document.mime_type;
  },
  get sha256() {
    return this.payload.document.sha256;
  },
  get caption() {
    return this.payload.document.caption;
  },
  get filename() {
    return this.payload.document.filename;
  },
});

export const VideoProto: VideoEvent = mixin(MessageProto, {
  category: 'message' as const,
  type: 'video' as const,
  get mediaId() {
    return this.payload.video.id;
  },
  get mimeType() {
    return this.payload.video.mime_type;
  },
  get sha256() {
    return this.payload.video.sha256;
  },
  get caption() {
    return this.payload.video.caption;
  },
  get filename() {
    return this.payload.video.filename;
  },
});

export const QuickReplyProto: QuickReplyEvent = mixin(MessageProto, {
  category: 'callback' as const,
  type: 'quick_reply' as const,
  get callbackData() {
    return this.payload.button.payload;
  },
  get text() {
    return this.payload.button.text;
  },
  get isForwarded() {
    return this.payload.context.forwarded;
  },
  get isFrequentlyForwarded() {
    return this.payload.context.frequently_forwarded;
  },
  get repliedMessageId() {
    return this.payload.context.id;
  },
});

export const ButtonInteractiveProto: ButtonInteractiveEvent = mixin(
  MessageProto,
  {
    category: 'callback' as const,
    type: 'button_interactive' as const,
    get callbackData() {
      return this.payload.interactive.button_reply.id;
    },
    get title() {
      return this.payload.interactive.button_reply.title;
    },
  },
);

export const ListInteractiveProto: ListInteractiveEvent = mixin(MessageProto, {
  category: 'callback' as const,
  type: 'list_interactive' as const,
  get callbackData() {
    return this.payload.interactive.list_reply.id;
  },
  get title() {
    return this.payload.interactive.list_reply.title;
  },
  get description() {
    return this.payload.interactive.list_reply.description;
  },
});

const UserChangeProto: UserChangeMixin = mixin(MessageProto, {
  get description() {
    return this.payload.system.body;
  },
  get originalNumber() {
    return this.payload.system.customer;
  },
});

export const UserNumberChangeProto: UserNumberChangeEvent = mixin(
  UserChangeProto,
  {
    category: 'system' as const,
    type: 'user_number_change' as const,
    get newNumber() {
      return this.payload.system.wa_id;
    },
  },
);

export const UserIdentityChangeProto: UserIdentityChangeEvent = mixin(
  UserChangeProto,
  {
    category: 'system' as const,
    type: 'user_identity_change' as const,
    get changeId() {
      return this.payload.system.identity;
    },
  },
);

export const ReferralProto: ReferralEvent = mixin(MessageProto, WithTextProto, {
  category: 'action' as const,
  type: 'referral' as const,
  get sourceUrl() {
    return this.payload.refferal.source_url;
  },
  get sourceType() {
    return this.payload.refferal.source_type;
  },
  get sourceId() {
    return this.payload.refferal.source_id;
  },
  get headline() {
    return this.payload.refferal.headline;
  },
  get body() {
    return this.payload.refferal.body;
  },
  get mediaType() {
    return this.payload.refferal.media_type;
  },
  get imageUrl() {
    return this.payload.refferal.image_url;
  },
  get videoUrl() {
    return this.payload.refferal.video_url;
  },
  get thumbnailUrl() {
    return this.payload.refferal.thumbnail_url;
  },
});

export const UnsupportedProto: UnsupportedEvent = mixin(MessageProto, {
  category: 'message' as const,
  type: 'unsupported' as const,
  get errorCode() {
    return this.payload.errors[0].code;
  },
  get errorTitle() {
    return this.payload.errors[0].title;
  },
  get errorDetails() {
    return this.payload.errors[0].details;
  },
});

const StatusProto: StatusMixin = mixin(EventBaseProto, {
  get channel() {
    return new WhatsAppAgent(this.agentNumberId);
  },
  get thread() {
    return new WhatsAppChat(this.agentNumberId, this.userNumberId);
  },
  get user() {
    return new WhatsAppUser(this.userNumberId);
  },
  get messageId() {
    return this.payload.id;
  },
  get userNumberId() {
    return this.payload.recipient_id;
  },
  get time() {
    return new Date(this.payload.timestamp);
  },
  get conversationId() {
    return this.payload.conversation.id;
  },
  get conversationOriginType() {
    return this.payload.conversation.origin.type;
  },
  get conversationExpireTime() {
    const timestamp = this.payload.conversation.expiration_timestamp;
    return timestamp && new Date(timestamp);
  },
});

export const ReadProto: ReadEvent = mixin(StatusProto, {
  category: 'action' as const,
  type: 'read' as const,
});

export const SentProto: SentEvent = mixin(StatusProto, {
  category: 'system' as const,
  type: 'sent' as const,
});

export const DeliveredProto: DeliveredEvent = mixin(StatusProto, {
  category: 'system' as const,
  type: 'delivered' as const,
});

export const FailedProto: FailedEvent = mixin(StatusProto, {
  category: 'system' as const,
  type: 'failed' as const,
});

export const ErrorProto: ErrorEvent = mixin(EventBaseProto, {
  category: 'system' as const,
  type: 'error' as const,
  channel: null,
  thread: null,
  user: null,
  get code() {
    return this.payload.code;
  },
  get title() {
    return this.payload.title;
  },
});

export const UnknownProto: UnknownEvent = mixin(EventBaseProto, {
  category: 'message' as const,
  type: 'unknown' as const,
  channel: null,
  thread: null,
  user: null,
});
