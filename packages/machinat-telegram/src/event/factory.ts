/** @internal */ /** */
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
  Poll,
  PollAnswer,
} from './mixins';
import { TelegramRawEvent } from '../types';
import TelegramChat from '../channel';
import TelegramUser from '../user';
import { TelegramEvent } from './types';

const makeEvent = <
  Proto extends object, // eslint-disable-line @typescript-eslint/ban-types
  Channel extends null | TelegramChat,
  User extends null | TelegramUser
>(
  payload: TelegramRawEvent,
  channel: Channel,
  user: User,
  proto: Proto
): {
  channel: Channel;
  user: User;
  payload: TelegramRawEvent;
} & Proto => {
  const event = Object.create(proto);

  event.channel = channel;
  event.user = user;
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
  kind: 'message' as const,
  type: 'text' as const,
});
const TextEditedMessageProto = mixin(EditedMessageProto, Text, {
  kind: 'edit_message' as const,
  type: 'text' as const,
});
const TextChannelPostProto = mixin(ChannelPostProto, Text, {
  kind: 'channel_post' as const,
  type: 'text' as const,
});
const TextEditedChannelPostProto = mixin(EditedChannelPostProto, Text, {
  kind: 'edit_channel_post' as const,
  type: 'text' as const,
});

const AnimationMessageProto = mixin(
  MessageProto,
  Animation,
  FileDetail,
  Caption,
  {
    kind: 'message' as const,
    type: 'animation' as const,
  }
);
const AnimationEditedMessageProto = mixin(
  EditedMessageProto,
  Animation,
  FileDetail,
  Caption,
  {
    kind: 'edit_message' as const,
    type: 'animation' as const,
  }
);
const AnimationChannelPostProto = mixin(
  ChannelPostProto,
  Animation,
  FileDetail,
  Caption,
  {
    kind: 'channel_post' as const,
    type: 'animation' as const,
  }
);
const AnimationEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Animation,
  FileDetail,
  Caption,
  {
    kind: 'edit_channel_post' as const,
    type: 'animation' as const,
  }
);

const AudioMessageProto = mixin(MessageProto, Audio, FileDetail, Caption, {
  kind: 'message' as const,
  type: 'audio' as const,
});
const AudioEditedMessageProto = mixin(
  EditedMessageProto,
  Audio,
  FileDetail,
  Caption,
  {
    kind: 'edit_message' as const,
    type: 'audio' as const,
  }
);
const AudioChannelPostProto = mixin(
  ChannelPostProto,
  Audio,
  FileDetail,
  Caption,
  {
    kind: 'channel_post' as const,
    type: 'audio' as const,
  }
);
const AudioEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Audio,
  FileDetail,
  Caption,
  {
    kind: 'edit_channel_post' as const,
    type: 'audio' as const,
  }
);

const DocumentMessageProto = mixin(
  MessageProto,
  Document,
  FileDetail,
  Caption,
  {
    kind: 'message' as const,
    type: 'document' as const,
  }
);
const DocumentEditedMessageProto = mixin(
  EditedMessageProto,
  Document,
  FileDetail,
  Caption,
  {
    kind: 'edit_message' as const,
    type: 'document' as const,
  }
);
const DocumentChannelPostProto = mixin(
  ChannelPostProto,
  Document,
  FileDetail,
  Caption,
  {
    kind: 'channel_post' as const,
    type: 'document' as const,
  }
);
const DocumentEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Document,
  FileDetail,
  Caption,
  {
    kind: 'edit_channel_post' as const,
    type: 'document' as const,
  }
);

const PhotoMessageProto = mixin(MessageProto, Photo, FileDetail, Caption, {
  kind: 'message' as const,
  type: 'photo' as const,
});
const PhotoEditedMessageProto = mixin(
  EditedMessageProto,
  Photo,
  FileDetail,
  Caption,
  {
    kind: 'edit_message' as const,
    type: 'photo' as const,
  }
);
const PhotoChannelPostProto = mixin(
  ChannelPostProto,
  Photo,
  FileDetail,
  Caption,
  {
    kind: 'channel_post' as const,
    type: 'photo' as const,
  }
);
const PhotoEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Photo,
  FileDetail,
  Caption,
  {
    kind: 'edit_channel_post' as const,
    type: 'photo' as const,
  }
);

const StickerMessageProto = mixin(MessageProto, Sticker, FileDetail, Caption, {
  kind: 'message' as const,
  type: 'sticker' as const,
});
const StickerEditedMessageProto = mixin(
  EditedMessageProto,
  Sticker,
  FileDetail,
  Caption,
  {
    kind: 'edit_message' as const,
    type: 'sticker' as const,
  }
);
const StickerChannelPostProto = mixin(
  ChannelPostProto,
  Sticker,
  FileDetail,
  Caption,
  {
    kind: 'channel_post' as const,
    type: 'sticker' as const,
  }
);
const StickerEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Sticker,
  FileDetail,
  Caption,
  {
    kind: 'edit_channel_post' as const,
    type: 'sticker' as const,
  }
);

const VideoMessageProto = mixin(MessageProto, Video, FileDetail, Caption, {
  kind: 'message' as const,
  type: 'video' as const,
});
const VideoEditedMessageProto = mixin(
  EditedMessageProto,
  Video,
  FileDetail,
  Caption,
  {
    kind: 'edit_message' as const,
    type: 'video' as const,
  }
);
const VideoChannelPostProto = mixin(
  ChannelPostProto,
  Video,
  FileDetail,
  Caption,
  {
    kind: 'channel_post' as const,
    type: 'video' as const,
  }
);
const VideoEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Video,
  FileDetail,
  Caption,
  {
    kind: 'edit_channel_post' as const,
    type: 'video' as const,
  }
);

const VideoNoteMessageProto = mixin(
  MessageProto,
  VideoNote,
  FileDetail,
  Caption,
  {
    kind: 'message' as const,
    type: 'video_note' as const,
  }
);
const VideoNoteChannelPostProto = mixin(
  ChannelPostProto,
  VideoNote,
  FileDetail,
  Caption,
  {
    kind: 'channel_post' as const,
    type: 'video_note' as const,
  }
);

const VoiceMessageProto = mixin(MessageProto, Voice, FileDetail, Caption, {
  kind: 'message' as const,
  type: 'voice' as const,
});
const VoiceEditedMessageProto = mixin(
  EditedMessageProto,
  Voice,
  FileDetail,
  Caption,
  {
    kind: 'edit_message' as const,
    type: 'voice' as const,
  }
);
const VoiceChannelPostProto = mixin(
  ChannelPostProto,
  Voice,
  FileDetail,
  Caption,
  {
    kind: 'channel_post' as const,
    type: 'voice' as const,
  }
);
const VoiceEditedChannelPostProto = mixin(
  EditedChannelPostProto,
  Voice,
  FileDetail,
  Caption,
  {
    kind: 'edit_channel_post' as const,
    type: 'voice' as const,
  }
);

const ContactMessageProto = mixin(MessageProto, Contact, {
  kind: 'message' as const,
  type: 'contact' as const,
});
const ContactChannelPostProto = mixin(ChannelPostProto, Contact, {
  kind: 'channel_post' as const,
  type: 'contact' as const,
});

const DiceMessageProto = mixin(MessageProto, Dice, {
  kind: 'message' as const,
  type: 'dice' as const,
});
const DiceChannelPostProto = mixin(ChannelPostProto, Dice, {
  kind: 'channel_post' as const,
  type: 'dice' as const,
});

const GameMessageProto = mixin(MessageProto, Game, {
  kind: 'message' as const,
  type: 'game' as const,
});
const GameEditedMessageProto = mixin(EditedMessageProto, Game, {
  kind: 'edit_message' as const,
  type: 'game' as const,
});

const PollMessageProto = mixin(MessageProto, MessagePoll, PollDetail, {
  kind: 'message' as const,
  type: 'poll' as const,
});
const PollChannelPostProto = mixin(ChannelPostProto, MessagePoll, PollDetail, {
  kind: 'channel_post' as const,
  type: 'poll' as const,
});

const VenueMessageProto = mixin(MessageProto, Venue, {
  kind: 'message' as const,
  type: 'venue' as const,
});
const VenueChannelPostProto = mixin(ChannelPostProto, Venue, {
  kind: 'channel_post' as const,
  type: 'venue' as const,
});

const LocationMessageProto = mixin(MessageProto, Location, {
  kind: 'message' as const,
  type: 'location' as const,
});
const LocationChannelPostProto = mixin(ChannelPostProto, Location, {
  kind: 'channel_post' as const,
  type: 'location' as const,
});

const MemberJoinActionProto = mixin(MessageProto, NewChatMembers, {
  kind: 'action' as const,
  type: 'member_join' as const,
});

const MemberLeaveActionProto = mixin(MessageProto, LeftChatMember, {
  kind: 'action' as const,
  type: 'member_leave' as const,
});

const NewChatTitleActionProto = mixin(MessageProto, NewChatTitle, {
  kind: 'action' as const,
  type: 'new_chat_title' as const,
});

const NewChatPhotoActionProto = mixin(MessageProto, NewChatPhoto, {
  kind: 'action' as const,
  type: 'new_chat_photo' as const,
});

const DeleteChatPhotoActionProto = mixin(MessageProto, {
  kind: 'action' as const,
  type: 'delete_chat_photo' as const,
});

const CreateGroupChatActionProto = mixin(MessageProto, {
  kind: 'action' as const,
  type: 'create_group_chat' as const,
});

const MigrateToChatActionProto = mixin(MessageProto, MigrateToChatId, {
  kind: 'action' as const,
  type: 'migrate_to_chat' as const,
});

const MigrateFromChatActionProto = mixin(MessageProto, MigrateFromChatId, {
  kind: 'action' as const,
  type: 'migrate_from_chat' as const,
});

const PinMessageActionProto = mixin(MessageProto, PinnedMessage, {
  kind: 'action' as const,
  type: 'pin_message' as const,
});

const SuccessfulPaymentPostbackProto = mixin(MessageProto, SuccessfulPayment, {
  kind: 'postback' as const,
  type: 'successful_payment' as const,
});

const InlineQueryPostbackProto = mixin(EventBase, InlineQuery, {
  kind: 'postback' as const,
  type: 'inline_query' as const,
});

const ChooseInlineResultPostbackProto = mixin(EventBase, ChosenInlineResult, {
  kind: 'postback' as const,
  type: 'choose_inline_result' as const,
});

const CallbackQueryPostbackProto = mixin(EventBase, CallbackQuery, {
  kind: 'postback' as const,
  type: 'callback_query' as const,
});

const ShippingQueryPostbackProto = mixin(EventBase, ShippingQuery, {
  kind: 'postback' as const,
  type: 'shipping_query' as const,
});

const PreCheckoutQueryPostbackProto = mixin(EventBase, PreCheckoutQuery, {
  kind: 'postback' as const,
  type: 'pre_checkout_query' as const,
});

const PollChangePostbackProto = mixin(EventBase, Poll, PollDetail, {
  kind: 'postback' as const,
  type: 'poll_change' as const,
});

const PollAnswerChangePostbackProto = mixin(EventBase, PollAnswer, {
  kind: 'postback' as const,
  type: 'poll_answer_change' as const,
});

const UnknownProto = mixin(EventBase, {
  kind: 'unknown' as const,
  type: 'unknown' as const,
});

const createEvent = (payload: TelegramRawEvent): TelegramEvent => {
  if (payload.message) {
    const { message } = payload;
    const channel = new TelegramChat(message.chat);

    if (message.successful_payment) {
      const user = new TelegramUser(message.from);
      return makeEvent(payload, channel, user, SuccessfulPaymentPostbackProto);
    }

    const user = message.from ? new TelegramUser(message.from) : null;

    return message.text
      ? makeEvent(payload, channel, user, TextMessageProto)
      : message.animation
      ? makeEvent(payload, channel, user, AnimationMessageProto)
      : message.audio
      ? makeEvent(payload, channel, user, AudioMessageProto)
      : message.document
      ? makeEvent(payload, channel, user, DocumentMessageProto)
      : message.photo
      ? makeEvent(payload, channel, user, PhotoMessageProto)
      : message.sticker
      ? makeEvent(payload, channel, user, StickerMessageProto)
      : message.video
      ? makeEvent(payload, channel, user, VideoMessageProto)
      : message.video_note
      ? makeEvent(payload, channel, user, VideoNoteMessageProto)
      : message.voice
      ? makeEvent(payload, channel, user, VoiceMessageProto)
      : message.contact
      ? makeEvent(payload, channel, user, ContactMessageProto)
      : message.dice
      ? makeEvent(payload, channel, user, DiceMessageProto)
      : message.game
      ? makeEvent(payload, channel, user, GameMessageProto)
      : message.poll
      ? makeEvent(payload, channel, user, PollMessageProto)
      : message.venue
      ? makeEvent(payload, channel, user, VenueMessageProto)
      : message.location
      ? makeEvent(payload, channel, user, LocationMessageProto)
      : message.new_chat_members
      ? makeEvent(payload, channel, user, MemberJoinActionProto)
      : message.left_chat_member
      ? makeEvent(payload, channel, user, MemberLeaveActionProto)
      : message.new_chat_title
      ? makeEvent(payload, channel, user, NewChatTitleActionProto)
      : message.new_chat_photo
      ? makeEvent(payload, channel, user, NewChatPhotoActionProto)
      : message.delete_chat_photo
      ? makeEvent(payload, channel, user, DeleteChatPhotoActionProto)
      : message.group_chat_created
      ? makeEvent(payload, channel, user, CreateGroupChatActionProto)
      : message.migrate_to_chat_id
      ? makeEvent(payload, channel, user, MigrateToChatActionProto)
      : message.migrate_from_chat_id
      ? makeEvent(payload, channel, user, MigrateFromChatActionProto)
      : message.pinned_message
      ? makeEvent(payload, channel, user, PinMessageActionProto)
      : makeEvent(payload, channel, user, UnknownProto);
  }

  if (payload.edited_message) {
    const { edited_message: message } = payload;
    const channel = new TelegramChat(message.chat);
    const user = message.from ? new TelegramUser(message.from) : null;

    return message.text
      ? makeEvent(payload, channel, user, TextEditedMessageProto)
      : message.animation
      ? makeEvent(payload, channel, user, AnimationEditedMessageProto)
      : message.audio
      ? makeEvent(payload, channel, user, AudioEditedMessageProto)
      : message.document
      ? makeEvent(payload, channel, user, DocumentEditedMessageProto)
      : message.photo
      ? makeEvent(payload, channel, user, PhotoEditedMessageProto)
      : message.sticker
      ? makeEvent(payload, channel, user, StickerEditedMessageProto)
      : message.video
      ? makeEvent(payload, channel, user, VideoEditedMessageProto)
      : message.voice
      ? makeEvent(payload, channel, user, VoiceEditedMessageProto)
      : message.game
      ? makeEvent(payload, channel, user, GameEditedMessageProto)
      : makeEvent(payload, channel, user, UnknownProto);
  }

  if (payload.channel_post) {
    const { channel_post: message } = payload;
    const channel = new TelegramChat(message.chat);

    return message.text
      ? makeEvent(payload, channel, null, TextChannelPostProto)
      : message.animation
      ? makeEvent(payload, channel, null, AnimationChannelPostProto)
      : message.audio
      ? makeEvent(payload, channel, null, AudioChannelPostProto)
      : message.document
      ? makeEvent(payload, channel, null, DocumentChannelPostProto)
      : message.photo
      ? makeEvent(payload, channel, null, PhotoChannelPostProto)
      : message.sticker
      ? makeEvent(payload, channel, null, StickerChannelPostProto)
      : message.video
      ? makeEvent(payload, channel, null, VideoChannelPostProto)
      : message.video_note
      ? makeEvent(payload, channel, null, VideoNoteChannelPostProto)
      : message.voice
      ? makeEvent(payload, channel, null, VoiceChannelPostProto)
      : message.contact
      ? makeEvent(payload, channel, null, ContactChannelPostProto)
      : message.dice
      ? makeEvent(payload, channel, null, DiceChannelPostProto)
      : message.poll
      ? makeEvent(payload, channel, null, PollChannelPostProto)
      : message.venue
      ? makeEvent(payload, channel, null, VenueChannelPostProto)
      : message.location
      ? makeEvent(payload, channel, null, LocationChannelPostProto)
      : makeEvent(payload, channel, null, UnknownProto);
  }

  if (payload.edited_channel_post) {
    const { edited_channel_post: message } = payload;
    const channel = new TelegramChat(message.chat);

    return message.text
      ? makeEvent(payload, channel, null, TextEditedChannelPostProto)
      : message.animation
      ? makeEvent(payload, channel, null, AnimationEditedChannelPostProto)
      : message.audio
      ? makeEvent(payload, channel, null, AudioEditedChannelPostProto)
      : message.document
      ? makeEvent(payload, channel, null, DocumentEditedChannelPostProto)
      : message.photo
      ? makeEvent(payload, channel, null, PhotoEditedChannelPostProto)
      : message.sticker
      ? makeEvent(payload, channel, null, StickerEditedChannelPostProto)
      : message.video
      ? makeEvent(payload, channel, null, VideoEditedChannelPostProto)
      : message.voice
      ? makeEvent(payload, channel, null, VoiceEditedChannelPostProto)
      : makeEvent(payload, channel, null, UnknownProto);
  }

  if (payload.shipping_query) {
    const { from: fromUser } = payload.shipping_query;
    const user = new TelegramUser(fromUser);
    const channel = TelegramChat.fromUser(user);

    return makeEvent(payload, channel, user, ShippingQueryPostbackProto);
  }

  if (payload.pre_checkout_query) {
    const { from: fromUser } = payload.pre_checkout_query;
    const user = new TelegramUser(fromUser);
    const channel = TelegramChat.fromUser(user);

    return makeEvent(payload, channel, user, PreCheckoutQueryPostbackProto);
  }

  if (payload.inline_query) {
    const { from: fromUser } = payload.inline_query;
    const user = new TelegramUser(fromUser);
    return makeEvent(payload, null, user, InlineQueryPostbackProto);
  }

  if (payload.chosen_inline_result) {
    const { from: fromUser } = payload.chosen_inline_result;
    const user = new TelegramUser(fromUser);
    return makeEvent(payload, null, user, ChooseInlineResultPostbackProto);
  }

  if (payload.callback_query) {
    const { from: fromUser, message } = payload.callback_query;
    const user = new TelegramUser(fromUser);
    const channel = message ? new TelegramChat(message.chat) : null;

    return makeEvent(payload, channel, user, CallbackQueryPostbackProto);
  }

  if (payload.poll) {
    return makeEvent(payload, null, null, PollChangePostbackProto);
  }

  if (payload.poll_answer) {
    const { user: fromUser } = payload.poll_answer;
    const user = new TelegramUser(fromUser);
    return makeEvent(payload, null, user, PollAnswerChangePostbackProto);
  }

  return makeEvent(payload, null, null, UnknownProto);
};

export default createEvent;
