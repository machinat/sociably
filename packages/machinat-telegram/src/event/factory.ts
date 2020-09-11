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
  Invoice,
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

const eventFactory = <
  P extends object, // eslint-disable-line @typescript-eslint/ban-types
  K extends string,
  T extends string
>(
  proto: P,
  kind: K,
  type: T
) => (
  payload: TelegramRawEvent
): {
  kind: K;
  type: T;
  payload: TelegramRawEvent;
} & P => {
  const event = Object.create(proto);

  event.kind = kind;
  event.type = type;
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

export const textMessage = eventFactory(
  mixin(MessageProto, Text),
  'message',
  'text'
);
export const editedTextMessage = eventFactory(
  mixin(EditedMessageProto, Text),
  'edit_message',
  'text'
);
export const textChannelPost = eventFactory(
  mixin(ChannelPostProto, Text),
  'channel_post',
  'text'
);
export const editedTextChannelPost = eventFactory(
  mixin(EditedChannelPostProto, Text),
  'edit_channel_post',
  'text'
);

export const animationMessage = eventFactory(
  mixin(MessageProto, Animation, FileDetail, Caption),
  'message',
  'animation'
);
export const editedAnimationMessage = eventFactory(
  mixin(EditedMessageProto, Animation, FileDetail, Caption),
  'edit_message',
  'animation'
);
export const animationChannelPost = eventFactory(
  mixin(ChannelPostProto, Animation, FileDetail, Caption),
  'channel_post',
  'animation'
);
export const editedAnimationChannelPost = eventFactory(
  mixin(EditedChannelPostProto, Animation, FileDetail, Caption),
  'edit_channel_post',
  'animation'
);

export const audioMessage = eventFactory(
  mixin(MessageProto, Audio, FileDetail, Caption),
  'message',
  'audio'
);
export const editedAudioMessage = eventFactory(
  mixin(EditedMessageProto, Audio, FileDetail, Caption),
  'edit_message',
  'audio'
);
export const audioChannelPost = eventFactory(
  mixin(ChannelPostProto, Audio, FileDetail, Caption),
  'channel_post',
  'audio'
);
export const editedAudioChannelPost = eventFactory(
  mixin(EditedChannelPostProto, Audio, FileDetail, Caption),
  'edit_channel_post',
  'audio'
);

export const documentMessage = eventFactory(
  mixin(MessageProto, Document, FileDetail, Caption),
  'message',
  'document'
);
export const editedDocumentMessage = eventFactory(
  mixin(EditedMessageProto, Document, FileDetail, Caption),
  'edit_message',
  'document'
);
export const documentChannelPost = eventFactory(
  mixin(ChannelPostProto, Document, FileDetail, Caption),
  'channel_post',
  'document'
);
export const editedDocumentChannelPost = eventFactory(
  mixin(EditedChannelPostProto, Document, FileDetail, Caption),
  'edit_channel_post',
  'document'
);

export const photoMessage = eventFactory(
  mixin(MessageProto, Photo, FileDetail, Caption),
  'message',
  'photo'
);
export const editedPhotoMessage = eventFactory(
  mixin(EditedMessageProto, Photo, FileDetail, Caption),
  'edit_message',
  'photo'
);
export const photoChannelPost = eventFactory(
  mixin(ChannelPostProto, Photo, FileDetail, Caption),
  'channel_post',
  'photo'
);
export const editedPhotoChannelPost = eventFactory(
  mixin(EditedChannelPostProto, Photo, FileDetail, Caption),
  'edit_channel_post',
  'photo'
);

export const stickerMessage = eventFactory(
  mixin(MessageProto, Sticker, FileDetail, Caption),
  'message',
  'sticker'
);
export const editedStickerMessage = eventFactory(
  mixin(EditedMessageProto, Sticker, FileDetail, Caption),
  'edit_message',
  'sticker'
);
export const stickerChannelPost = eventFactory(
  mixin(ChannelPostProto, Sticker, FileDetail, Caption),
  'channel_post',
  'sticker'
);
export const editedStickerChannelPost = eventFactory(
  mixin(EditedChannelPostProto, Sticker, FileDetail, Caption),
  'edit_channel_post',
  'sticker'
);

export const videoMessage = eventFactory(
  mixin(MessageProto, Video, FileDetail, Caption),
  'message',
  'video'
);
export const editedVideoMessage = eventFactory(
  mixin(EditedMessageProto, Video, FileDetail, Caption),
  'edit_message',
  'video'
);
export const videoChannelPost = eventFactory(
  mixin(ChannelPostProto, Video, FileDetail, Caption),
  'channel_post',
  'video'
);
export const editedVideoChannelPost = eventFactory(
  mixin(EditedChannelPostProto, Video, FileDetail, Caption),
  'edit_channel_post',
  'video'
);

export const videoNoteMessage = eventFactory(
  mixin(MessageProto, VideoNote, FileDetail, Caption),
  'message',
  'video_note'
);
export const editedVideoNoteMessage = eventFactory(
  mixin(EditedMessageProto, VideoNote, FileDetail, Caption),
  'edit_message',
  'video_note'
);
export const videoNoteChannelPost = eventFactory(
  mixin(ChannelPostProto, VideoNote, FileDetail, Caption),
  'channel_post',
  'video_note'
);
export const editedVideoNoteChannelPost = eventFactory(
  mixin(EditedChannelPostProto, VideoNote, FileDetail, Caption),
  'edit_channel_post',
  'video_note'
);

export const voiceMessage = eventFactory(
  mixin(MessageProto, Voice, FileDetail, Caption),
  'message',
  'voice'
);
export const editedVoiceMessage = eventFactory(
  mixin(EditedMessageProto, Voice, FileDetail, Caption),
  'edit_message',
  'voice'
);
export const voiceChannelPost = eventFactory(
  mixin(ChannelPostProto, Voice, FileDetail, Caption),
  'channel_post',
  'voice'
);
export const editedVoiceChannelPost = eventFactory(
  mixin(EditedChannelPostProto, Voice, FileDetail, Caption),
  'edit_channel_post',
  'voice'
);

export const contactMessage = eventFactory(
  mixin(MessageProto, Contact),
  'message',
  'contact'
);
export const contactChannelPost = eventFactory(
  mixin(ChannelPostProto, Contact),
  'channel_post',
  'contact'
);

export const diceMessage = eventFactory(
  mixin(MessageProto, Dice),
  'message',
  'dice'
);
export const diceChannelPost = eventFactory(
  mixin(ChannelPostProto, Dice),
  'channel_post',
  'dice'
);

export const gameMessage = eventFactory(
  mixin(MessageProto, Game),
  'message',
  'game'
);
export const editedGameMessage = eventFactory(
  mixin(EditedMessageProto, Game),
  'edit_message',
  'game'
);

export const pollMessage = eventFactory(
  mixin(MessageProto, MessagePoll, PollDetail),
  'message',
  'poll'
);
export const pollChannelPost = eventFactory(
  mixin(ChannelPostProto, MessagePoll, PollDetail),
  'channel_post',
  'poll'
);

export const venueMessage = eventFactory(
  mixin(MessageProto, Venue),
  'message',
  'venue'
);
export const venueChannelPost = eventFactory(
  mixin(ChannelPostProto, Venue),
  'channel_post',
  'venue'
);

export const locationMessage = eventFactory(
  mixin(MessageProto, Location),
  'message',
  'location'
);
export const locationChannelPost = eventFactory(
  mixin(ChannelPostProto, Location),
  'channel_post',
  'location'
);

export const memberJoinAction = eventFactory(
  mixin(MessageProto, NewChatMembers),
  'action',
  'member_join'
);

export const memberLeave = eventFactory(
  mixin(MessageProto, LeftChatMember),
  'action',
  'member_leave'
);

export const newChatTitleAction = eventFactory(
  mixin(MessageProto, NewChatTitle),
  'action',
  'new_chat_title'
);

export const newChatPhotoAction = eventFactory(
  mixin(MessageProto, NewChatPhoto),
  'action',
  'new_chat_photo'
);

export const deleteChatPhotoAction = eventFactory(
  MessageProto,
  'action',
  'delete_chat_photo'
);

export const createGroupChatAction = eventFactory(
  MessageProto,
  'action',
  'create_group_chat'
);

export const migrateToChatAction = eventFactory(
  mixin(MessageProto, MigrateToChatId),
  'action',
  'migrate_to_chat'
);

export const migrateFromChatAction = eventFactory(
  mixin(MessageProto, MigrateFromChatId),
  'action',
  'migrate_from_chat'
);

export const pinMessageAction = eventFactory(
  mixin(MessageProto, PinnedMessage),
  'action',
  'pin_message'
);

export const invoiceMessage = eventFactory(
  mixin(MessageProto, Invoice),
  'message',
  'invoice'
);

export const successfulPaymentPostback = eventFactory(
  mixin(MessageProto, SuccessfulPayment),
  'postback',
  'successful_payment'
);

export const inlineQueryPostback = eventFactory(
  mixin(EventBase, InlineQuery),
  'postback',
  'inline_query'
);

export const chooseInlineResultPostback = eventFactory(
  mixin(EventBase, ChosenInlineResult),
  'postback',
  'choose_inline_result'
);

export const callbackQueryPostback = eventFactory(
  mixin(EventBase, CallbackQuery),
  'postback',
  'callback_query'
);

export const shippingQueryPostback = eventFactory(
  mixin(EventBase, ShippingQuery),
  'postback',
  'shipping_query'
);

export const preCheckoutQueryPostback = eventFactory(
  mixin(EventBase, PreCheckoutQuery),
  'postback',
  'pre_checkout_query'
);

export const pollChangePostback = eventFactory(
  mixin(EventBase, Poll, PollDetail),
  'postback',
  'poll_change'
);

export const pollAnswerChangePostback = eventFactory(
  mixin(EventBase, PollAnswer),
  'postback',
  'poll_answer_change'
);

export const unknown = eventFactory(EventBase, 'unknown', 'unknown');
