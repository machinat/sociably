import type {
  EventBase,
  Message,
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
  MessagePoll,
  PollChange,
  PollDetail,
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
  PollAnswer,
} from './mixins';
import type { TelegramRawEvent } from '../types';

interface EventObject<Kind extends string, Type extends string> {
  kind: Kind;
  type: Type;
  botId: number;
  payload: TelegramRawEvent;
}

/**
 * A text message.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'text'`
 */
export interface TextEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'text'
    >,
    EventBase,
    Message,
    MessageDetail,
    Text {}

/**
 * Message is an animation.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'animation'`
 */
export interface AnimationEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'animation'
    >,
    EventBase,
    Message,
    MessageDetail,
    Animation,
    FileDetail,
    Caption {}

/**
 * Message is an audio file.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'audio'`
 */
export interface AudioEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'audio'
    >,
    EventBase,
    Message,
    MessageDetail,
    Audio,
    FileDetail,
    Caption {}

/**
 * Message is a general file.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'document'`
 */
export interface DocumentEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'document'
    >,
    EventBase,
    Message,
    MessageDetail,
    Document,
    FileDetail,
    Caption {}

/**
 * Message is a photo.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'photo'`
 */
export interface PhotoEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'photo'
    >,
    EventBase,
    Message,
    MessageDetail,
    Photo,
    FileDetail,
    Caption {}

/**
 * Message is a sticker.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'sticker'`
 */
export interface StickerEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'sticker'
    >,
    EventBase,
    Message,
    MessageDetail,
    Sticker,
    FileDetail {}

/**
 * Message is a video.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'video'`
 */
export interface VideoEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'video'
    >,
    EventBase,
    Message,
    MessageDetail,
    Video,
    FileDetail,
    Caption {}

/**
 * Message is a video note.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'video_note'`
 */
export interface VideoNoteEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'video_note'
    >,
    EventBase,
    Message,
    MessageDetail,
    VideoNote,
    FileDetail {}

/**
 * Message is a voice message.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message' | 'channel_post' | 'edit_channel_post'`
 * @type `'voice'`
 */
export interface VoiceEvent
  extends EventObject<
      'message' | 'edit_message' | 'channel_post' | 'edit_channel_post',
      'voice'
    >,
    EventBase,
    Message,
    MessageDetail,
    Voice,
    FileDetail,
    Caption {}

/**
 * Message is a shared contact.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'channel_post'`
 * @type `'contact'`
 */
export interface ContactEvent
  extends EventObject<'message' | 'channel_post', 'contact'>,
    EventBase,
    Message,
    MessageDetail,
    Contact {}

/**
 * Message is a dice with random value from 1 to 6.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'channel_post'`
 * @type `'dice'`
 */
export interface DiceEvent
  extends EventObject<'message' | 'channel_post', 'dice'>,
    EventBase,
    Message,
    MessageDetail,
    Dice {}

/**
 * Message is a game.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'edit_message'`
 * @type `'game'`
 */
export interface GameEvent
  extends EventObject<'message' | 'edit_message', 'game'>,
    EventBase,
    Message,
    MessageDetail,
    Game {}

/**
 * Message is a native poll.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'channel_post'`
 * @type `'poll'`
 */
export interface PollEvent
  extends EventObject<'message' | 'channel_post', 'poll'>,
    EventBase,
    Message,
    MessageDetail,
    MessagePoll,
    PollDetail {}

/**
 * Message is a venue.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'channel_post'`
 * @type `'venue'`
 */
export interface VenueEvent
  extends EventObject<'message' | 'channel_post', 'venue'>,
    EventBase,
    Message,
    MessageDetail,
    Venue {}

/**
 * Message is a shared location.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'message' | 'channel_post'`
 * @type `'location'`
 */
export interface LocationEvent
  extends EventObject<'message' | 'channel_post', 'location'>,
    EventBase,
    Message,
    MessageDetail,
    Location {}

/**
 * New members were added to the group or supergroup.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'member_join'`
 */
export interface MemberJoinEvent
  extends EventObject<'action', 'member_join'>,
    EventBase,
    Message,
    MessageDetail,
    NewChatMembers {}

/**
 * A member was removed from the group.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'member_leave'`
 */
export interface MemberLeaveEvent
  extends EventObject<'action', 'member_leave'>,
    EventBase,
    Message,
    MessageDetail,
    LeftChatMember {}

/**
 * The chat title was changed
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'new_chat_title'`
 */
export interface NewChatTitleEvent
  extends EventObject<'action', 'new_chat_title'>,
    EventBase,
    Message,
    MessageDetail,
    NewChatTitle {}

/**
 * The chat photo was changed.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'new_chat_photo'`
 */
export interface NewChatPhotoEvent
  extends EventObject<'action', 'new_chat_photo'>,
    EventBase,
    Message,
    MessageDetail,
    NewChatPhoto {}

/**
 * The chat photo was deleted.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'delete_chat_photo'`
 */
export interface DeleteChatPhotoEvent
  extends EventObject<'action', 'delete_chat_photo'>,
    EventBase,
    Message,
    MessageDetail {}

/**
 * The group has been created.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'create_group_chat'`
 */
export interface CreatGroupChatEvent
  extends EventObject<'action', 'create_group_chat'>,
    EventBase,
    Message,
    MessageDetail {}

/**
 * The group has been migrated to a supergroup with the specified identifier.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'migrate_to_chat'`
 */
export interface MigrateToChatEvent
  extends EventObject<'action', 'migrate_to_chat'>,
    EventBase,
    Message,
    MessageDetail,
    MigrateToChatId {}

/**
 * The supergroup has been migrated from a group with the specified identifier.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'migrate_from_chat'`
 */
export interface MigrateFromChatEvent
  extends EventObject<'action', 'migrate_from_chat'>,
    EventBase,
    Message,
    MessageDetail,
    MigrateFromChatId {}

/**
 * Specified message was pinned.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'action'`
 * @type `'pin_message'`
 */
export interface PinMessageEvent
  extends EventObject<'action', 'pin_message'>,
    EventBase,
    Message,
    MessageDetail,
    PinnedMessage {}

/**
 * Message is a service message about a successful payment.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'postback'`
 * @type `'successful_payment'`
 */
export interface SuccessfulPaymentEvent
  extends EventObject<'postback', 'successful_payment'>,
    EventBase,
    Message,
    MessageDetail,
    SuccessfulPayment {}

/**
 * New incoming inline query.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequery).
 * @kind `'postback'`
 * @type `'inline_query'`
 */
export interface InlineQueryEvent
  extends EventObject<'postback', 'inline_query'>,
    EventBase,
    InlineQuery {}

/**
 * The result of an inline query that was chosen by a user and sent to their chat partner.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#choseninlineresult).
 * @kind `'postback'`
 * @type `'choose_inline_result'`
 */
export interface ChooseInlineResultEvent
  extends EventObject<'postback', 'choose_inline_result'>,
    EventBase,
    ChosenInlineResult {}

/**
 * New incoming callback query.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#callbackquery).
 * @kind `'postback'`
 * @type `'callback_query'`
 */
export interface CallbackQueryEvent
  extends EventObject<'postback', 'callback_query'>,
    EventBase,
    CallbackQuery {}

/**
 * New incoming shipping query. Only for invoices with flexible price.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#shippingquery).
 * @kind `'postback'`
 * @type `'shipping_query'`
 */
export interface ShippingQueryEvent
  extends EventObject<'postback', 'shipping_query'>,
    EventBase,
    ShippingQuery {}

/**
 * New incoming pre-checkout query. Contains full information about checkout.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#precheckoutquery).
 * @kind `'postback'`
 * @type `'pre_checkout_query'`
 */
export interface PreCheckoutQueryEvent
  extends EventObject<'postback', 'pre_checkout_query'>,
    EventBase,
    PreCheckoutQuery {}

/**
 * New poll state. Bots receive only updates about stopped polls and polls, which are sent by the bot.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#poll).
 * @kind `'postback'`
 * @type `'poll_change'`
 */
export interface PollChangeEvent
  extends EventObject<'postback', 'poll_change'>,
    EventBase,
    PollChange,
    PollDetail {}

/**
 * A user changed their answer in a non-anonymous poll. Bots receive new votes only in polls that were sent by the bot itself.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#pollanswer).
 * @kind `'postback'`
 * @type `'poll_answer_change'`
 */
export interface PollAnswerChangeEvent
  extends EventObject<'postback', 'poll_answer_change'>,
    EventBase,
    PollAnswer {}

/**
 * An unknown message met.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @kind `'unknown'`
 * @type `'unknown'`
 */
export interface UnknownEvent
  extends EventObject<'unknown', 'unknown'>,
    EventBase {}

export type TelegramEvent =
  | TextEvent
  | AnimationEvent
  | AudioEvent
  | DocumentEvent
  | PhotoEvent
  | StickerEvent
  | VideoEvent
  | VideoNoteEvent
  | VoiceEvent
  | ContactEvent
  | DiceEvent
  | GameEvent
  | PollEvent
  | VenueEvent
  | LocationEvent
  | MemberJoinEvent
  | MemberLeaveEvent
  | NewChatTitleEvent
  | NewChatPhotoEvent
  | DeleteChatPhotoEvent
  | CreatGroupChatEvent
  | MigrateToChatEvent
  | MigrateFromChatEvent
  | PinMessageEvent
  | SuccessfulPaymentEvent
  | InlineQueryEvent
  | ChooseInlineResultEvent
  | CallbackQueryEvent
  | ShippingQueryEvent
  | PreCheckoutQueryEvent
  | PollChangeEvent
  | PollAnswerChangeEvent
  | UnknownEvent;
