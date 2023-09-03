import { mixin } from '@sociably/core/utils';
import {
  EventBase,
  Message,
  EditedMessage,
  ChannelPost,
  EditedChannelPost,
  MessageDetail,
  Text,
  FileDetail,
  Animation,
  Audio,
  Document,
  Photo,
  Sticker,
  Video,
  VideoNote,
  Voice,
  Caption,
  Contact,
  Dice,
  Game,
  PollDetail,
  MessagePoll,
  Venue,
  Location,
  NewChatMembers,
  LeftChatMember,
  NewChatTitle,
  NewChatPhoto,
  MigrateToChatId,
  MigrateFromChatId,
  PinnedMessage,
  SuccessfulPayment,
  InlineQuery,
  ChosenInlineResult,
  CallbackBase,
  CallbackQuery,
  CallbackGame,
  ShippingQuery,
  PreCheckoutQuery,
  PollChange,
  PollAnswer,
  ChatMember,
  MyChatMember,
  ChatMemberUpdated,
  Unknown,
} from './mixins.js';
import { TelegramRawEvent } from '../types.js';
import { TelegramEvent } from './types.js';

const makeEventObject = <Proto extends {}>(
  botId: number,
  payload: TelegramRawEvent,
  proto: Proto,
): {
  botId: number;
  payload: TelegramRawEvent;
} & Proto => {
  const event = Object.create(proto);

  event.botId = botId;
  event.payload = payload;

  return event;
};

const MessageProto = mixin(EventBase, Message, MessageDetail);
const EditedMessageProto = mixin(EventBase, EditedMessage, MessageDetail);
const ChannelPostProto = mixin(EventBase, ChannelPost, MessageDetail);
const EditedChannelPostProto = mixin(
  EventBase,
  EditedChannelPost,
  MessageDetail,
);

const TextMessageProto = mixin(MessageProto, Text, {
  category: 'message' as const,
  type: 'text' as const,
});
const TextEditedMessageProto = mixin(EditedMessageProto, Text, {
  category: 'edit_message' as const,
  type: 'text' as const,
});
const TextChannelPostProto = mixin(ChannelPostProto, Text, {
  category: 'channel_post' as const,
  type: 'text' as const,
});
const TextEditedChannelPostProto = mixin(EditedChannelPostProto, Text, {
  category: 'edit_channel_post' as const,
  type: 'text' as const,
});

const AnimationMessageProto = mixin(
  MessageProto,
  Animation,
  FileDetail,
  Caption,
  {
    category: 'message' as const,
    type: 'animation' as const,
  },
);
const AnimationEditedMessageProto = mixin(
  EditedMessageProto,
  Animation,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'animation' as const,
  },
);
const AnimationChannelPostProto = mixin(
  ChannelPostProto,
  Animation,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'animation' as const,
  },
);
const AnimationEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Animation,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'animation' as const,
  },
);

const AudioMessageProto = mixin(MessageProto, Audio, FileDetail, Caption, {
  category: 'message' as const,
  type: 'audio' as const,
});
const AudioEditedMessageProto = mixin(
  EditedMessageProto,
  Audio,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'audio' as const,
  },
);
const AudioChannelPostProto = mixin(
  ChannelPostProto,
  Audio,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'audio' as const,
  },
);
const AudioEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Audio,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'audio' as const,
  },
);

const DocumentMessageProto = mixin(
  MessageProto,
  Document,
  FileDetail,
  Caption,
  {
    category: 'message' as const,
    type: 'document' as const,
  },
);
const DocumentEditedMessageProto = mixin(
  EditedMessageProto,
  Document,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'document' as const,
  },
);
const DocumentChannelPostProto = mixin(
  ChannelPostProto,
  Document,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'document' as const,
  },
);
const DocumentEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Document,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'document' as const,
  },
);

const PhotoMessageProto = mixin(MessageProto, Photo, FileDetail, Caption, {
  category: 'message' as const,
  type: 'photo' as const,
});
const PhotoEditedMessageProto = mixin(
  EditedMessageProto,
  Photo,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'photo' as const,
  },
);
const PhotoChannelPostProto = mixin(
  ChannelPostProto,
  Photo,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'photo' as const,
  },
);
const PhotoEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Photo,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'photo' as const,
  },
);

const StickerMessageProto = mixin(MessageProto, Sticker, FileDetail, Caption, {
  category: 'message' as const,
  type: 'sticker' as const,
});
const StickerEditedMessageProto = mixin(
  EditedMessageProto,
  Sticker,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'sticker' as const,
  },
);
const StickerChannelPostProto = mixin(
  ChannelPostProto,
  Sticker,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'sticker' as const,
  },
);
const StickerEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Sticker,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'sticker' as const,
  },
);

const VideoMessageProto = mixin(MessageProto, Video, FileDetail, Caption, {
  category: 'message' as const,
  type: 'video' as const,
});
const VideoEditedMessageProto = mixin(
  EditedMessageProto,
  Video,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'video' as const,
  },
);
const VideoChannelPostProto = mixin(
  ChannelPostProto,
  Video,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'video' as const,
  },
);
const VideoEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Video,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'video' as const,
  },
);

const VideoNoteMessageProto = mixin(
  MessageProto,
  VideoNote,
  FileDetail,
  Caption,
  {
    category: 'message' as const,
    type: 'video_note' as const,
  },
);
const VideoNoteChannelPostProto = mixin(
  ChannelPostProto,
  VideoNote,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'video_note' as const,
  },
);

const VoiceMessageProto = mixin(MessageProto, Voice, FileDetail, Caption, {
  category: 'message' as const,
  type: 'voice' as const,
});
const VoiceEditedMessageProto = mixin(
  EditedMessageProto,
  Voice,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'voice' as const,
  },
);
const VoiceChannelPostProto = mixin(
  ChannelPostProto,
  Voice,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'voice' as const,
  },
);
const VoiceEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Voice,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'voice' as const,
  },
);

const ContactMessageProto = mixin(MessageProto, Contact, {
  category: 'message' as const,
  type: 'contact' as const,
});
const ContactChannelPostProto = mixin(ChannelPostProto, Contact, {
  category: 'channel_post' as const,
  type: 'contact' as const,
});

const DiceMessageProto = mixin(MessageProto, Dice, {
  category: 'message' as const,
  type: 'dice' as const,
});
const DiceChannelPostProto = mixin(ChannelPostProto, Dice, {
  category: 'channel_post' as const,
  type: 'dice' as const,
});

const GameMessageProto = mixin(MessageProto, Game, {
  category: 'message' as const,
  type: 'game' as const,
});
const GameEditedMessageProto = mixin(EditedMessageProto, Game, {
  category: 'edit_message' as const,
  type: 'game' as const,
});

const PollMessageProto = mixin(MessageProto, MessagePoll, PollDetail, {
  category: 'message' as const,
  type: 'poll' as const,
});
const PollChannelPostProto = mixin(ChannelPostProto, MessagePoll, PollDetail, {
  category: 'channel_post' as const,
  type: 'poll' as const,
});

const VenueMessageProto = mixin(MessageProto, Venue, {
  category: 'message' as const,
  type: 'venue' as const,
});
const VenueChannelPostProto = mixin(ChannelPostProto, Venue, {
  category: 'channel_post' as const,
  type: 'venue' as const,
});

const LocationMessageProto = mixin(MessageProto, Location, {
  category: 'message' as const,
  type: 'location' as const,
});
const LocationChannelPostProto = mixin(ChannelPostProto, Location, {
  category: 'channel_post' as const,
  type: 'location' as const,
});

const NewChatMembersMessageProto = mixin(MessageProto, NewChatMembers, {
  category: 'action' as const,
  type: 'new_chat_members' as const,
});

const LeftChatMemberMessageProto = mixin(MessageProto, LeftChatMember, {
  category: 'action' as const,
  type: 'left_chat_member' as const,
});

const NewChatTitleActionProto = mixin(MessageProto, NewChatTitle, {
  category: 'action' as const,
  type: 'new_chat_title' as const,
});

const NewChatPhotoActionProto = mixin(MessageProto, NewChatPhoto, {
  category: 'action' as const,
  type: 'new_chat_photo' as const,
});

const DeleteChatPhotoActionProto = mixin(MessageProto, {
  category: 'action' as const,
  type: 'delete_chat_photo' as const,
});

const CreateGroupChatActionProto = mixin(MessageProto, {
  category: 'action' as const,
  type: 'create_group_chat' as const,
});

const MigrateToChatActionProto = mixin(MessageProto, MigrateToChatId, {
  category: 'action' as const,
  type: 'migrate_to_chat' as const,
});

const MigrateFromChatActionProto = mixin(MessageProto, MigrateFromChatId, {
  category: 'action' as const,
  type: 'migrate_from_chat' as const,
});

const PinMessageActionProto = mixin(MessageProto, PinnedMessage, {
  category: 'action' as const,
  type: 'pin_message' as const,
});

const SuccessfulPaymentPostbackProto = mixin(MessageProto, SuccessfulPayment, {
  category: 'callback' as const,
  type: 'successful_payment' as const,
});

const InlineQueryPostbackProto = mixin(EventBase, InlineQuery, {
  category: 'callback' as const,
  type: 'inline_query' as const,
});

const ChooseInlineResultPostbackProto = mixin(EventBase, ChosenInlineResult, {
  category: 'callback' as const,
  type: 'choose_inline_result' as const,
});

const CallbackQueryPostbackProto = mixin(
  EventBase,
  CallbackBase,
  CallbackQuery,
  {
    category: 'callback' as const,
    type: 'callback_query' as const,
  },
);

const CallbackGamePostbackProto = mixin(EventBase, CallbackBase, CallbackGame, {
  category: 'callback' as const,
  type: 'callback_game' as const,
});

const ShippingQueryPostbackProto = mixin(EventBase, ShippingQuery, {
  category: 'callback' as const,
  type: 'shipping_query' as const,
});

const PreCheckoutQueryPostbackProto = mixin(EventBase, PreCheckoutQuery, {
  category: 'callback' as const,
  type: 'pre_checkout_query' as const,
});

const PollChangePostbackProto = mixin(EventBase, PollChange, PollDetail, {
  category: 'callback' as const,
  type: 'poll_change' as const,
});

const PollAnswerChangePostbackProto = mixin(EventBase, PollAnswer, {
  category: 'callback' as const,
  type: 'poll_answer_change' as const,
});

const BotMemberUpdatedActionProto = mixin(
  EventBase,
  MyChatMember,
  ChatMemberUpdated,
  {
    category: 'action' as const,
    type: 'bot_member_updated' as const,
  },
);

const ChatMemberUpdatedActionProto = mixin(
  EventBase,
  ChatMember,
  ChatMemberUpdated,
  {
    category: 'action' as const,
    type: 'chat_member_updated' as const,
  },
);

const UnknownProto = mixin(EventBase, Unknown, {
  category: 'unknown' as const,
  type: 'unknown' as const,
});

const createEvent = (
  botId: number,
  payload: TelegramRawEvent,
): TelegramEvent => {
  if (payload.message) {
    const { message } = payload;

    return message.text
      ? makeEventObject(botId, payload, TextMessageProto)
      : message.animation
      ? makeEventObject(botId, payload, AnimationMessageProto)
      : message.audio
      ? makeEventObject(botId, payload, AudioMessageProto)
      : message.document
      ? makeEventObject(botId, payload, DocumentMessageProto)
      : message.photo
      ? makeEventObject(botId, payload, PhotoMessageProto)
      : message.sticker
      ? makeEventObject(botId, payload, StickerMessageProto)
      : message.video
      ? makeEventObject(botId, payload, VideoMessageProto)
      : message.video_note
      ? makeEventObject(botId, payload, VideoNoteMessageProto)
      : message.voice
      ? makeEventObject(botId, payload, VoiceMessageProto)
      : message.contact
      ? makeEventObject(botId, payload, ContactMessageProto)
      : message.dice
      ? makeEventObject(botId, payload, DiceMessageProto)
      : message.game
      ? makeEventObject(botId, payload, GameMessageProto)
      : message.poll
      ? makeEventObject(botId, payload, PollMessageProto)
      : message.venue
      ? makeEventObject(botId, payload, VenueMessageProto)
      : message.location
      ? makeEventObject(botId, payload, LocationMessageProto)
      : message.new_chat_members
      ? makeEventObject(botId, payload, NewChatMembersMessageProto)
      : message.left_chat_member
      ? makeEventObject(botId, payload, LeftChatMemberMessageProto)
      : message.new_chat_title
      ? makeEventObject(botId, payload, NewChatTitleActionProto)
      : message.new_chat_photo
      ? makeEventObject(botId, payload, NewChatPhotoActionProto)
      : message.delete_chat_photo
      ? makeEventObject(botId, payload, DeleteChatPhotoActionProto)
      : message.group_chat_created
      ? makeEventObject(botId, payload, CreateGroupChatActionProto)
      : message.migrate_to_chat_id
      ? makeEventObject(botId, payload, MigrateToChatActionProto)
      : message.migrate_from_chat_id
      ? makeEventObject(botId, payload, MigrateFromChatActionProto)
      : message.pinned_message
      ? makeEventObject(botId, payload, PinMessageActionProto)
      : message.successful_payment
      ? makeEventObject(botId, payload, SuccessfulPaymentPostbackProto)
      : makeEventObject(botId, payload, UnknownProto);
  }

  if (payload.edited_message) {
    const { edited_message: message } = payload;

    return message.text
      ? makeEventObject(botId, payload, TextEditedMessageProto)
      : message.animation
      ? makeEventObject(botId, payload, AnimationEditedMessageProto)
      : message.audio
      ? makeEventObject(botId, payload, AudioEditedMessageProto)
      : message.document
      ? makeEventObject(botId, payload, DocumentEditedMessageProto)
      : message.photo
      ? makeEventObject(botId, payload, PhotoEditedMessageProto)
      : message.sticker
      ? makeEventObject(botId, payload, StickerEditedMessageProto)
      : message.video
      ? makeEventObject(botId, payload, VideoEditedMessageProto)
      : message.voice
      ? makeEventObject(botId, payload, VoiceEditedMessageProto)
      : message.game
      ? makeEventObject(botId, payload, GameEditedMessageProto)
      : makeEventObject(botId, payload, UnknownProto);
  }

  if (payload.channel_post) {
    const { channel_post: message } = payload;

    return message.text
      ? makeEventObject(botId, payload, TextChannelPostProto)
      : message.animation
      ? makeEventObject(botId, payload, AnimationChannelPostProto)
      : message.audio
      ? makeEventObject(botId, payload, AudioChannelPostProto)
      : message.document
      ? makeEventObject(botId, payload, DocumentChannelPostProto)
      : message.photo
      ? makeEventObject(botId, payload, PhotoChannelPostProto)
      : message.sticker
      ? makeEventObject(botId, payload, StickerChannelPostProto)
      : message.video
      ? makeEventObject(botId, payload, VideoChannelPostProto)
      : message.video_note
      ? makeEventObject(botId, payload, VideoNoteChannelPostProto)
      : message.voice
      ? makeEventObject(botId, payload, VoiceChannelPostProto)
      : message.contact
      ? makeEventObject(botId, payload, ContactChannelPostProto)
      : message.dice
      ? makeEventObject(botId, payload, DiceChannelPostProto)
      : message.poll
      ? makeEventObject(botId, payload, PollChannelPostProto)
      : message.venue
      ? makeEventObject(botId, payload, VenueChannelPostProto)
      : message.location
      ? makeEventObject(botId, payload, LocationChannelPostProto)
      : makeEventObject(botId, payload, UnknownProto);
  }

  if (payload.edited_channel_post) {
    const { edited_channel_post: message } = payload;

    return message.text
      ? makeEventObject(botId, payload, TextEditedChannelPostProto)
      : message.animation
      ? makeEventObject(botId, payload, AnimationEditedChannelPostProto)
      : message.audio
      ? makeEventObject(botId, payload, AudioEditedChannelPostProto)
      : message.document
      ? makeEventObject(botId, payload, DocumentEditedChannelPostProto)
      : message.photo
      ? makeEventObject(botId, payload, PhotoEditedChannelPostProto)
      : message.sticker
      ? makeEventObject(botId, payload, StickerEditedChannelPostProto)
      : message.video
      ? makeEventObject(botId, payload, VideoEditedChannelPostProto)
      : message.voice
      ? makeEventObject(botId, payload, VoiceEditedChannelPostProto)
      : makeEventObject(botId, payload, UnknownProto);
  }

  return payload.shipping_query
    ? makeEventObject(botId, payload, ShippingQueryPostbackProto)
    : payload.pre_checkout_query
    ? makeEventObject(botId, payload, PreCheckoutQueryPostbackProto)
    : payload.inline_query
    ? makeEventObject(botId, payload, InlineQueryPostbackProto)
    : payload.chosen_inline_result
    ? makeEventObject(botId, payload, ChooseInlineResultPostbackProto)
    : payload.callback_query
    ? payload.callback_query.game_short_name
      ? makeEventObject(botId, payload, CallbackGamePostbackProto)
      : makeEventObject(botId, payload, CallbackQueryPostbackProto)
    : payload.poll
    ? makeEventObject(botId, payload, PollChangePostbackProto)
    : payload.poll_answer
    ? makeEventObject(botId, payload, PollAnswerChangePostbackProto)
    : payload.my_chat_member
    ? makeEventObject(botId, payload, BotMemberUpdatedActionProto)
    : payload.chat_member
    ? makeEventObject(botId, payload, ChatMemberUpdatedActionProto)
    : makeEventObject(botId, payload, UnknownProto);
};

export default createEvent;
