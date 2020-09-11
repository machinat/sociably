/** @internal */ /** */
import {
  textMessage,
  editedTextMessage,
  textChannelPost,
  editedTextChannelPost,
  animationMessage,
  editedAnimationMessage,
  animationChannelPost,
  editedAnimationChannelPost,
  audioMessage,
  editedAudioMessage,
  audioChannelPost,
  editedAudioChannelPost,
  documentMessage,
  editedDocumentMessage,
  documentChannelPost,
  editedDocumentChannelPost,
  photoMessage,
  editedPhotoMessage,
  photoChannelPost,
  editedPhotoChannelPost,
  stickerMessage,
  editedStickerMessage,
  stickerChannelPost,
  editedStickerChannelPost,
  videoMessage,
  editedVideoMessage,
  videoChannelPost,
  editedVideoChannelPost,
  videoNoteMessage,
  editedVideoNoteMessage,
  videoNoteChannelPost,
  editedVideoNoteChannelPost,
  voiceMessage,
  editedVoiceMessage,
  voiceChannelPost,
  editedVoiceChannelPost,
  contactMessage,
  contactChannelPost,
  diceMessage,
  diceChannelPost,
  gameMessage,
  editedGameMessage,
  pollMessage,
  pollChannelPost,
  venueMessage,
  venueChannelPost,
  locationMessage,
  locationChannelPost,
  memberJoinAction,
  memberLeave,
  newChatTitleAction,
  newChatPhotoAction,
  deleteChatPhotoAction,
  createGroupChatAction,
  migrateToChatAction,
  migrateFromChatAction,
  pinMessageAction,
  invoiceMessage,
  successfulPaymentPostback,
  inlineQueryPostback,
  chooseInlineResultPostback,
  callbackQueryPostback,
  shippingQueryPostback,
  preCheckoutQueryPostback,
  pollChangePostback,
  pollAnswerChangePostback,
  unknown,
} from './factory';
import type { TelegramRawEvent } from '../types';
import { TelegramEvent } from './types';

const createMessageEvent = (
  messageKind:
    | 'message'
    | 'edited_message'
    | 'channel_post'
    | 'edited_channel_post',
  raw: TelegramRawEvent
) => {
  const message = raw[messageKind];

  return message.text
    ? messageKind === 'message'
      ? textMessage(raw)
      : messageKind === 'edited_message'
      ? editedTextMessage(raw)
      : messageKind === 'channel_post'
      ? textChannelPost(raw)
      : editedTextChannelPost(raw)
    : message.animation
    ? messageKind === 'message'
      ? animationMessage(raw)
      : messageKind === 'edited_message'
      ? editedAnimationMessage(raw)
      : messageKind === 'channel_post'
      ? animationChannelPost(raw)
      : editedAnimationChannelPost(raw)
    : message.audio
    ? messageKind === 'message'
      ? audioMessage(raw)
      : messageKind === 'edited_message'
      ? editedAudioMessage(raw)
      : messageKind === 'channel_post'
      ? audioChannelPost(raw)
      : editedAudioChannelPost(raw)
    : message.document
    ? messageKind === 'message'
      ? documentMessage(raw)
      : messageKind === 'edited_message'
      ? editedDocumentMessage(raw)
      : messageKind === 'channel_post'
      ? documentChannelPost(raw)
      : editedDocumentChannelPost(raw)
    : message.photo
    ? messageKind === 'message'
      ? photoMessage(raw)
      : messageKind === 'edited_message'
      ? editedPhotoMessage(raw)
      : messageKind === 'channel_post'
      ? photoChannelPost(raw)
      : editedPhotoChannelPost(raw)
    : message.sticker
    ? messageKind === 'message'
      ? stickerMessage(raw)
      : messageKind === 'edited_message'
      ? editedStickerMessage(raw)
      : messageKind === 'channel_post'
      ? stickerChannelPost(raw)
      : editedStickerChannelPost(raw)
    : message.video
    ? messageKind === 'message'
      ? videoMessage(raw)
      : messageKind === 'edited_message'
      ? editedVideoMessage(raw)
      : messageKind === 'channel_post'
      ? videoChannelPost(raw)
      : editedVideoChannelPost(raw)
    : message.video_note
    ? messageKind === 'message'
      ? videoNoteMessage(raw)
      : messageKind === 'edited_message'
      ? editedVideoNoteMessage(raw)
      : messageKind === 'channel_post'
      ? videoNoteChannelPost(raw)
      : editedVideoNoteChannelPost(raw)
    : message.voice
    ? messageKind === 'message'
      ? voiceMessage(raw)
      : messageKind === 'edited_message'
      ? editedVoiceMessage(raw)
      : messageKind === 'channel_post'
      ? voiceChannelPost(raw)
      : editedVoiceChannelPost(raw)
    : message.contact
    ? messageKind === 'message'
      ? contactMessage(raw)
      : messageKind === 'channel_post'
      ? contactChannelPost(raw)
      : unknown(raw)
    : message.dice
    ? messageKind === 'message'
      ? diceMessage(raw)
      : messageKind === 'channel_post'
      ? diceChannelPost(raw)
      : unknown(raw)
    : message.game
    ? messageKind === 'message'
      ? gameMessage(raw)
      : messageKind === 'edited_message'
      ? editedGameMessage(raw)
      : unknown(raw)
    : message.poll
    ? messageKind === 'message'
      ? pollMessage(raw)
      : messageKind === 'channel_post'
      ? pollChannelPost(raw)
      : unknown(raw)
    : message.venue
    ? messageKind === 'message'
      ? venueMessage(raw)
      : messageKind === 'channel_post'
      ? venueChannelPost(raw)
      : unknown(raw)
    : message.location
    ? messageKind === 'message'
      ? locationMessage(raw)
      : messageKind === 'channel_post'
      ? locationChannelPost(raw)
      : unknown(raw)
    : message.new_chat_members
    ? messageKind === 'message'
      ? memberJoinAction(raw)
      : unknown(raw)
    : message.left_chat_member
    ? messageKind === 'message'
      ? memberLeave(raw)
      : unknown(raw)
    : message.new_chat_title
    ? messageKind === 'message'
      ? newChatTitleAction(raw)
      : unknown(raw)
    : message.new_chat_photo
    ? messageKind === 'message'
      ? newChatPhotoAction(raw)
      : unknown(raw)
    : message.delete_chat_photo
    ? messageKind === 'message'
      ? deleteChatPhotoAction(raw)
      : unknown(raw)
    : message.group_chat_created
    ? messageKind === 'message'
      ? createGroupChatAction(raw)
      : unknown(raw)
    : message.migrate_to_chat_id
    ? messageKind === 'message'
      ? migrateToChatAction(raw)
      : unknown(raw)
    : message.migrate_from_chat_id
    ? messageKind === 'message'
      ? migrateFromChatAction(raw)
      : unknown(raw)
    : message.pinned_message
    ? messageKind === 'message'
      ? pinMessageAction(raw)
      : unknown(raw)
    : message.invoice
    ? messageKind === 'message'
      ? invoiceMessage(raw)
      : unknown(raw)
    : message.successful_payment
    ? messageKind === 'message'
      ? successfulPaymentPostback(raw)
      : unknown(raw)
    : unknown(raw);
};

const createEvent = (raw: TelegramRawEvent): TelegramEvent => {
  return raw.message
    ? createMessageEvent('message', raw)
    : raw.edited_message
    ? createMessageEvent('edited_message', raw)
    : raw.channel_post
    ? createMessageEvent('channel_post', raw)
    : raw.edited_channel_post
    ? createMessageEvent('edited_channel_post', raw)
    : raw.inline_query
    ? inlineQueryPostback(raw)
    : raw.chosen_inline_result
    ? chooseInlineResultPostback(raw)
    : raw.callback_query
    ? callbackQueryPostback(raw)
    : raw.shipping_query
    ? shippingQueryPostback(raw)
    : raw.pre_checkout_query
    ? preCheckoutQueryPostback(raw)
    : raw.poll
    ? pollChangePostback(raw)
    : raw.poll_answer
    ? pollAnswerChangePostback(raw)
    : unknown(raw);
};

export default createEvent;
