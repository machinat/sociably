import {
  TextMessageEvent,
  EditTextMessageEvent,
  TextChannelPostEvent,
  EditTextChannelPostEvent,
  AnimationMessageEvent,
  EditAnimationMessageEvent,
  AnimationChannelPostEvent,
  EditAnimationChannelPostEvent,
  AudioMessageEvent,
  EditAudioMessageEvent,
  AudioChannelPostEvent,
  EditAudioChannelPostEvent,
  DocumentMessageEvent,
  EditDocumentMessageEvent,
  DocumentChannelPostEvent,
  EditDocumentChannelPostEvent,
  PhotoMessageEvent,
  EditPhotoMessageEvent,
  PhotoChannelPostEvent,
  EditPhotoChannelPostEvent,
  StickerMessageEvent,
  EditStickerMessageEvent,
  StickerChannelPostEvent,
  EditStickerChannelPostEvent,
  VideoMessageEvent,
  EditVideoMessageEvent,
  VideoChannelPostEvent,
  EditVideoChannelPostEvent,
  VideoNoteMessageEvent,
  VideoNoteChannelPostEvent,
  VoiceMessageEvent,
  EditVoiceMessageEvent,
  VoiceChannelPostEvent,
  EditVoiceChannelPostEvent,
  ContactMessageEvent,
  ContactChannelPostEvent,
  DiceMessageEvent,
  DiceChannelPostEvent,
  GameMessageEvent,
  EditGameMessageEvent,
  PollMessageEvent,
  PollChannelPostEvent,
  VenueMessageEvent,
  VenueChannelPostEvent,
  LocationMessageEvent,
  LocationChannelPostEvent,
  NewChatMembersActionEvent,
  LeftChatMemberActionEvent,
  NewChatTitleActionEvent,
  NewChatPhotoActionEvent,
  DeleteChatPhotoActionEvent,
  CreateGroupChatActionEvent,
  MigrateToChatActionEvent,
  MigrateFromChatActionEvent,
  PinMessageActionEvent,
  SuccessfulPaymentCallbackEvent,
  InlineQueryCallbackEvent,
  ChooseInlineResultCallbackEvent,
  CallbackQueryCallbackEvent,
  CallbackGameCallbackEvent,
  ShippingQueryCallbackEvent,
  PreCheckoutQueryCallbackEvent,
  PollChangeCallbackEvent,
  PollAnswerChangeCallbackEvent,
  BotMemberUpdatedActionEvent,
  ChatMemberUpdatedActionEvent,
  UnknownEvent,
} from './events.js';
import { TelegramRawEvent } from '../types.js';

const createEvent = (botId: number, payload: TelegramRawEvent) => {
  if (payload.message) {
    const { message } = payload;

    return message.text
      ? new TextMessageEvent(botId, payload)
      : message.animation
      ? new AnimationMessageEvent(botId, payload)
      : message.audio
      ? new AudioMessageEvent(botId, payload)
      : message.document
      ? new DocumentMessageEvent(botId, payload)
      : message.photo
      ? new PhotoMessageEvent(botId, payload)
      : message.sticker
      ? new StickerMessageEvent(botId, payload)
      : message.video
      ? new VideoMessageEvent(botId, payload)
      : message.video_note
      ? new VideoNoteMessageEvent(botId, payload)
      : message.voice
      ? new VoiceMessageEvent(botId, payload)
      : message.contact
      ? new ContactMessageEvent(botId, payload)
      : message.dice
      ? new DiceMessageEvent(botId, payload)
      : message.game
      ? new GameMessageEvent(botId, payload)
      : message.poll
      ? new PollMessageEvent(botId, payload)
      : message.venue
      ? new VenueMessageEvent(botId, payload)
      : message.location
      ? new LocationMessageEvent(botId, payload)
      : message.new_chat_members
      ? new NewChatMembersActionEvent(botId, payload)
      : message.left_chat_member
      ? new LeftChatMemberActionEvent(botId, payload)
      : message.new_chat_title
      ? new NewChatTitleActionEvent(botId, payload)
      : message.new_chat_photo
      ? new NewChatPhotoActionEvent(botId, payload)
      : message.delete_chat_photo
      ? new DeleteChatPhotoActionEvent(botId, payload)
      : message.group_chat_created
      ? new CreateGroupChatActionEvent(botId, payload)
      : message.migrate_to_chat_id
      ? new MigrateToChatActionEvent(botId, payload)
      : message.migrate_from_chat_id
      ? new MigrateFromChatActionEvent(botId, payload)
      : message.pinned_message
      ? new PinMessageActionEvent(botId, payload)
      : message.successful_payment
      ? new SuccessfulPaymentCallbackEvent(botId, payload)
      : new UnknownEvent(botId, payload);
  }

  if (payload.edited_message) {
    const { edited_message: message } = payload;

    return message.text
      ? new EditTextMessageEvent(botId, payload)
      : message.animation
      ? new EditAnimationMessageEvent(botId, payload)
      : message.audio
      ? new EditAudioMessageEvent(botId, payload)
      : message.document
      ? new EditDocumentMessageEvent(botId, payload)
      : message.photo
      ? new EditPhotoMessageEvent(botId, payload)
      : message.sticker
      ? new EditStickerMessageEvent(botId, payload)
      : message.video
      ? new EditVideoMessageEvent(botId, payload)
      : message.voice
      ? new EditVoiceMessageEvent(botId, payload)
      : message.game
      ? new EditGameMessageEvent(botId, payload)
      : new UnknownEvent(botId, payload);
  }

  if (payload.channel_post) {
    const { channel_post: message } = payload;

    return message.text
      ? new TextChannelPostEvent(botId, payload)
      : message.animation
      ? new AnimationChannelPostEvent(botId, payload)
      : message.audio
      ? new AudioChannelPostEvent(botId, payload)
      : message.document
      ? new DocumentChannelPostEvent(botId, payload)
      : message.photo
      ? new PhotoChannelPostEvent(botId, payload)
      : message.sticker
      ? new StickerChannelPostEvent(botId, payload)
      : message.video
      ? new VideoChannelPostEvent(botId, payload)
      : message.video_note
      ? new VideoNoteChannelPostEvent(botId, payload)
      : message.voice
      ? new VoiceChannelPostEvent(botId, payload)
      : message.contact
      ? new ContactChannelPostEvent(botId, payload)
      : message.dice
      ? new DiceChannelPostEvent(botId, payload)
      : message.poll
      ? new PollChannelPostEvent(botId, payload)
      : message.venue
      ? new VenueChannelPostEvent(botId, payload)
      : message.location
      ? new LocationChannelPostEvent(botId, payload)
      : new UnknownEvent(botId, payload);
  }

  if (payload.edited_channel_post) {
    const { edited_channel_post: message } = payload;

    return message.text
      ? new EditTextChannelPostEvent(botId, payload)
      : message.animation
      ? new EditAnimationChannelPostEvent(botId, payload)
      : message.audio
      ? new EditAudioChannelPostEvent(botId, payload)
      : message.document
      ? new EditDocumentChannelPostEvent(botId, payload)
      : message.photo
      ? new EditPhotoChannelPostEvent(botId, payload)
      : message.sticker
      ? new EditStickerChannelPostEvent(botId, payload)
      : message.video
      ? new EditVideoChannelPostEvent(botId, payload)
      : message.voice
      ? new EditVoiceChannelPostEvent(botId, payload)
      : new UnknownEvent(botId, payload);
  }

  return payload.shipping_query
    ? new ShippingQueryCallbackEvent(botId, payload)
    : payload.pre_checkout_query
    ? new PreCheckoutQueryCallbackEvent(botId, payload)
    : payload.inline_query
    ? new InlineQueryCallbackEvent(botId, payload)
    : payload.chosen_inline_result
    ? new ChooseInlineResultCallbackEvent(botId, payload)
    : payload.callback_query
    ? payload.callback_query.game_short_name
      ? new CallbackGameCallbackEvent(botId, payload)
      : new CallbackQueryCallbackEvent(botId, payload)
    : payload.poll
    ? new PollChangeCallbackEvent(botId, payload)
    : payload.poll_answer
    ? new PollAnswerChangeCallbackEvent(botId, payload)
    : payload.my_chat_member
    ? new BotMemberUpdatedActionEvent(botId, payload)
    : payload.chat_member
    ? new ChatMemberUpdatedActionEvent(botId, payload)
    : new UnknownEvent(botId, payload);
};

export default createEvent;
