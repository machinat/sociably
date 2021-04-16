import mixin from '@machinat/core/utils/mixin';
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
  CallbackQuery,
  ShippingQuery,
  PreCheckoutQuery,
  PollChange,
  PollAnswer,
  ChatMember,
  MyChatMember,
  ChatMemberUpdated,
  Unknown,
} from './mixins';
import { TelegramRawEvent } from '../types';
import { TelegramEvent } from './types';

const makeEvent = <Proto extends {}>(
  botId: number,
  payload: TelegramRawEvent,
  proto: Proto
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
  MessageDetail
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
  }
);
const AnimationEditedMessageProto = mixin(
  EditedMessageProto,
  Animation,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'animation' as const,
  }
);
const AnimationChannelPostProto = mixin(
  ChannelPostProto,
  Animation,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'animation' as const,
  }
);
const AnimationEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Animation,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'animation' as const,
  }
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
  }
);
const AudioChannelPostProto = mixin(
  ChannelPostProto,
  Audio,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'audio' as const,
  }
);
const AudioEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Audio,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'audio' as const,
  }
);

const DocumentMessageProto = mixin(
  MessageProto,
  Document,
  FileDetail,
  Caption,
  {
    category: 'message' as const,
    type: 'document' as const,
  }
);
const DocumentEditedMessageProto = mixin(
  EditedMessageProto,
  Document,
  FileDetail,
  Caption,
  {
    category: 'edit_message' as const,
    type: 'document' as const,
  }
);
const DocumentChannelPostProto = mixin(
  ChannelPostProto,
  Document,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'document' as const,
  }
);
const DocumentEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Document,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'document' as const,
  }
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
  }
);
const PhotoChannelPostProto = mixin(
  ChannelPostProto,
  Photo,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'photo' as const,
  }
);
const PhotoEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Photo,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'photo' as const,
  }
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
  }
);
const StickerChannelPostProto = mixin(
  ChannelPostProto,
  Sticker,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'sticker' as const,
  }
);
const StickerEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Sticker,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'sticker' as const,
  }
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
  }
);
const VideoChannelPostProto = mixin(
  ChannelPostProto,
  Video,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'video' as const,
  }
);
const VideoEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Video,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'video' as const,
  }
);

const VideoNoteMessageProto = mixin(
  MessageProto,
  VideoNote,
  FileDetail,
  Caption,
  {
    category: 'message' as const,
    type: 'video_note' as const,
  }
);
const VideoNoteChannelPostProto = mixin(
  ChannelPostProto,
  VideoNote,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'video_note' as const,
  }
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
  }
);
const VoiceChannelPostProto = mixin(
  ChannelPostProto,
  Voice,
  FileDetail,
  Caption,
  {
    category: 'channel_post' as const,
    type: 'voice' as const,
  }
);
const VoiceEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Voice,
  FileDetail,
  Caption,
  {
    category: 'edit_channel_post' as const,
    type: 'voice' as const,
  }
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
  category: 'postback' as const,
  type: 'successful_payment' as const,
});

const InlineQueryPostbackProto = mixin(EventBase, InlineQuery, {
  category: 'postback' as const,
  type: 'inline_query' as const,
});

const ChooseInlineResultPostbackProto = mixin(EventBase, ChosenInlineResult, {
  category: 'postback' as const,
  type: 'choose_inline_result' as const,
});

const CallbackQueryPostbackProto = mixin(EventBase, CallbackQuery, {
  category: 'postback' as const,
  type: 'callback_query' as const,
});

const ShippingQueryPostbackProto = mixin(EventBase, ShippingQuery, {
  category: 'postback' as const,
  type: 'shipping_query' as const,
});

const PreCheckoutQueryPostbackProto = mixin(EventBase, PreCheckoutQuery, {
  category: 'postback' as const,
  type: 'pre_checkout_query' as const,
});

const PollChangePostbackProto = mixin(EventBase, PollChange, PollDetail, {
  category: 'postback' as const,
  type: 'poll_change' as const,
});

const PollAnswerChangePostbackProto = mixin(EventBase, PollAnswer, {
  category: 'postback' as const,
  type: 'poll_answer_change' as const,
});

const BotMemberUpdatedActionProto = mixin(
  EventBase,
  MyChatMember,
  ChatMemberUpdated,
  {
    category: 'action' as const,
    type: 'bot_member_updated' as const,
  }
);

const ChatMemberUpdatedActionProto = mixin(
  EventBase,
  ChatMember,
  ChatMemberUpdated,
  {
    category: 'action' as const,
    type: 'chat_member_updated' as const,
  }
);

const UnknownProto = mixin(EventBase, Unknown, {
  category: 'unknown' as const,
  type: 'unknown' as const,
});

const eventFactory = (botId: number) => (
  payload: TelegramRawEvent
): TelegramEvent => {
  if (payload.message) {
    const { message } = payload;

    return message.text
      ? makeEvent(botId, payload, TextMessageProto)
      : message.animation
      ? makeEvent(botId, payload, AnimationMessageProto)
      : message.audio
      ? makeEvent(botId, payload, AudioMessageProto)
      : message.document
      ? makeEvent(botId, payload, DocumentMessageProto)
      : message.photo
      ? makeEvent(botId, payload, PhotoMessageProto)
      : message.sticker
      ? makeEvent(botId, payload, StickerMessageProto)
      : message.video
      ? makeEvent(botId, payload, VideoMessageProto)
      : message.video_note
      ? makeEvent(botId, payload, VideoNoteMessageProto)
      : message.voice
      ? makeEvent(botId, payload, VoiceMessageProto)
      : message.contact
      ? makeEvent(botId, payload, ContactMessageProto)
      : message.dice
      ? makeEvent(botId, payload, DiceMessageProto)
      : message.game
      ? makeEvent(botId, payload, GameMessageProto)
      : message.poll
      ? makeEvent(botId, payload, PollMessageProto)
      : message.venue
      ? makeEvent(botId, payload, VenueMessageProto)
      : message.location
      ? makeEvent(botId, payload, LocationMessageProto)
      : message.new_chat_members
      ? makeEvent(botId, payload, NewChatMembersMessageProto)
      : message.left_chat_member
      ? makeEvent(botId, payload, LeftChatMemberMessageProto)
      : message.new_chat_title
      ? makeEvent(botId, payload, NewChatTitleActionProto)
      : message.new_chat_photo
      ? makeEvent(botId, payload, NewChatPhotoActionProto)
      : message.delete_chat_photo
      ? makeEvent(botId, payload, DeleteChatPhotoActionProto)
      : message.group_chat_created
      ? makeEvent(botId, payload, CreateGroupChatActionProto)
      : message.migrate_to_chat_id
      ? makeEvent(botId, payload, MigrateToChatActionProto)
      : message.migrate_from_chat_id
      ? makeEvent(botId, payload, MigrateFromChatActionProto)
      : message.pinned_message
      ? makeEvent(botId, payload, PinMessageActionProto)
      : message.successful_payment
      ? makeEvent(botId, payload, SuccessfulPaymentPostbackProto)
      : makeEvent(botId, payload, UnknownProto);
  }

  if (payload.edited_message) {
    const { edited_message: message } = payload;

    return message.text
      ? makeEvent(botId, payload, TextEditedMessageProto)
      : message.animation
      ? makeEvent(botId, payload, AnimationEditedMessageProto)
      : message.audio
      ? makeEvent(botId, payload, AudioEditedMessageProto)
      : message.document
      ? makeEvent(botId, payload, DocumentEditedMessageProto)
      : message.photo
      ? makeEvent(botId, payload, PhotoEditedMessageProto)
      : message.sticker
      ? makeEvent(botId, payload, StickerEditedMessageProto)
      : message.video
      ? makeEvent(botId, payload, VideoEditedMessageProto)
      : message.voice
      ? makeEvent(botId, payload, VoiceEditedMessageProto)
      : message.game
      ? makeEvent(botId, payload, GameEditedMessageProto)
      : makeEvent(botId, payload, UnknownProto);
  }

  if (payload.channel_post) {
    const { channel_post: message } = payload;

    return message.text
      ? makeEvent(botId, payload, TextChannelPostProto)
      : message.animation
      ? makeEvent(botId, payload, AnimationChannelPostProto)
      : message.audio
      ? makeEvent(botId, payload, AudioChannelPostProto)
      : message.document
      ? makeEvent(botId, payload, DocumentChannelPostProto)
      : message.photo
      ? makeEvent(botId, payload, PhotoChannelPostProto)
      : message.sticker
      ? makeEvent(botId, payload, StickerChannelPostProto)
      : message.video
      ? makeEvent(botId, payload, VideoChannelPostProto)
      : message.video_note
      ? makeEvent(botId, payload, VideoNoteChannelPostProto)
      : message.voice
      ? makeEvent(botId, payload, VoiceChannelPostProto)
      : message.contact
      ? makeEvent(botId, payload, ContactChannelPostProto)
      : message.dice
      ? makeEvent(botId, payload, DiceChannelPostProto)
      : message.poll
      ? makeEvent(botId, payload, PollChannelPostProto)
      : message.venue
      ? makeEvent(botId, payload, VenueChannelPostProto)
      : message.location
      ? makeEvent(botId, payload, LocationChannelPostProto)
      : makeEvent(botId, payload, UnknownProto);
  }

  if (payload.edited_channel_post) {
    const { edited_channel_post: message } = payload;

    return message.text
      ? makeEvent(botId, payload, TextEditedChannelPostProto)
      : message.animation
      ? makeEvent(botId, payload, AnimationEditedChannelPostProto)
      : message.audio
      ? makeEvent(botId, payload, AudioEditedChannelPostProto)
      : message.document
      ? makeEvent(botId, payload, DocumentEditedChannelPostProto)
      : message.photo
      ? makeEvent(botId, payload, PhotoEditedChannelPostProto)
      : message.sticker
      ? makeEvent(botId, payload, StickerEditedChannelPostProto)
      : message.video
      ? makeEvent(botId, payload, VideoEditedChannelPostProto)
      : message.voice
      ? makeEvent(botId, payload, VoiceEditedChannelPostProto)
      : makeEvent(botId, payload, UnknownProto);
  }

  return payload.shipping_query
    ? makeEvent(botId, payload, ShippingQueryPostbackProto)
    : payload.pre_checkout_query
    ? makeEvent(botId, payload, PreCheckoutQueryPostbackProto)
    : payload.inline_query
    ? makeEvent(botId, payload, InlineQueryPostbackProto)
    : payload.chosen_inline_result
    ? makeEvent(botId, payload, ChooseInlineResultPostbackProto)
    : payload.callback_query
    ? makeEvent(botId, payload, CallbackQueryPostbackProto)
    : payload.poll
    ? makeEvent(botId, payload, PollChangePostbackProto)
    : payload.poll_answer
    ? makeEvent(botId, payload, PollAnswerChangePostbackProto)
    : payload.my_chat_member
    ? makeEvent(botId, payload, BotMemberUpdatedActionProto)
    : payload.chat_member
    ? makeEvent(botId, payload, ChatMemberUpdatedActionProto)
    : makeEvent(botId, payload, UnknownProto);
};

export default eventFactory;
