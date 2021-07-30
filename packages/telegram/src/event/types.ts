import type {
  EventBase,
  Message,
  ChannelPost,
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
  ChatMember,
  ChatMemberUpdated,
  Unknown,
} from './mixins';
import type { TelegramRawEvent } from '../types';

interface EventObject<Category extends string, Type extends string> {
  category: Category;
  type: Type;
  botId: number;
  payload: TelegramRawEvent;
}

/**
 * A text message.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'text'`
 */
export interface TextMessageEvent
  extends EventObject<'message' | 'edit_message', 'text'>,
    EventBase,
    Message,
    MessageDetail,
    Text {}

/**
 * A text message.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'text'`
 */
export interface TextChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'text'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Text {}

/**
 * Message is an animation.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'animation'`
 */
export interface AnimationMessageEvent
  extends EventObject<'message' | 'edit_message', 'animation'>,
    EventBase,
    Message,
    MessageDetail,
    Animation,
    FileDetail,
    Caption {}

/**
 * Message is an animation.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'animation'`
 */
export interface AnimationChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'animation'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Animation,
    FileDetail,
    Caption {}

/**
 * Message is an audio file.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'audio'`
 */
export interface AudioMessageEvent
  extends EventObject<'message' | 'edit_message', 'audio'>,
    EventBase,
    Message,
    MessageDetail,
    Audio,
    FileDetail,
    Caption {}

/**
 * Message is an audio file.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'audio'`
 */
export interface AudioChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'audio'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Audio,
    FileDetail,
    Caption {}

/**
 * Message is a general file.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'document'`
 */
export interface DocumentMessageEvent
  extends EventObject<'message' | 'edit_message', 'document'>,
    EventBase,
    Message,
    MessageDetail,
    Document,
    FileDetail,
    Caption {}

/**
 * Message is a general file.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'document'`
 */
export interface DocumentChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'document'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Document,
    FileDetail,
    Caption {}

/**
 * Message is a photo.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'photo'`
 */
export interface PhotoMessageEvent
  extends EventObject<'message' | 'edit_message', 'photo'>,
    EventBase,
    Message,
    MessageDetail,
    Photo,
    FileDetail,
    Caption {}

/**
 * Message is a photo.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'photo'`
 */
export interface PhotoChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'photo'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Photo,
    FileDetail,
    Caption {}

/**
 * Message is a sticker.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'sticker'`
 */
export interface StickerMessageEvent
  extends EventObject<'message' | 'edit_message', 'sticker'>,
    EventBase,
    Message,
    MessageDetail,
    Sticker,
    FileDetail {}

/**
 * Message is a sticker.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'sticker'`
 */
export interface StickerChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'sticker'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Sticker,
    FileDetail {}

/**
 * Message is a video.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'video'`
 */
export interface VideoMessageEvent
  extends EventObject<'message' | 'edit_message', 'video'>,
    EventBase,
    Message,
    MessageDetail,
    Video,
    FileDetail,
    Caption {}

/**
 * Message is a video.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'video'`
 */
export interface VideoChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'video'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Video,
    FileDetail,
    Caption {}

/**
 * Message is a video note.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'video_note'`
 */
export interface VideoNoteMessageEvent
  extends EventObject<'message' | 'edit_message', 'video_note'>,
    EventBase,
    Message,
    MessageDetail,
    VideoNote,
    FileDetail {}

/**
 * Message is a video note.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'video_note'`
 */
export interface VideoNoteChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'video_note'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    VideoNote,
    FileDetail {}

/**
 * Message is a voice message.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'voice'`
 */
export interface VoiceMessageEvent
  extends EventObject<'message' | 'edit_message', 'voice'>,
    EventBase,
    Message,
    MessageDetail,
    Voice,
    FileDetail,
    Caption {}

/**
 * Message is a voice message.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post' | 'edit_channel_post'`
 * @eventType `'voice'`
 */
export interface VoiceChannelPostEvent
  extends EventObject<'channel_post' | 'edit_channel_post', 'voice'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Voice,
    FileDetail,
    Caption {}

/**
 * Message is a shared contact.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message'`
 * @eventType `'contact'`
 */
export interface ContactMessageEvent
  extends EventObject<'message', 'contact'>,
    EventBase,
    Message,
    MessageDetail,
    Contact {}

/**
 * Message is a shared contact.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post'`
 * @eventType `'contact'`
 */
export interface ContactChannelPostEvent
  extends EventObject<'channel_post', 'contact'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Contact {}

/**
 * Message is a dice with random value from 1 to 6.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message'`
 * @eventType `'dice'`
 */
export interface DiceMessageEvent
  extends EventObject<'message', 'dice'>,
    EventBase,
    Message,
    MessageDetail,
    Dice {}

/**
 * Message is a dice with random value from 1 to 6.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post'`
 * @eventType `'dice'`
 */
export interface DiceChannelPostEvent
  extends EventObject<'channel_post', 'dice'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Dice {}

/**
 * Message is a game.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message' | 'edit_message'`
 * @eventType `'game'`
 */
export interface GameMessageEvent
  extends EventObject<'message' | 'edit_message', 'game'>,
    EventBase,
    Message,
    MessageDetail,
    Game {}

/**
 * Message is a native poll.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message'`
 * @eventType `'poll'`
 */
export interface PollMessageEvent
  extends EventObject<'message', 'poll'>,
    EventBase,
    Message,
    MessageDetail,
    MessagePoll,
    PollDetail {}

/**
 * Message is a native poll.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post'`
 * @eventType `'poll'`
 */
export interface PollChannelPostEvent
  extends EventObject<'channel_post', 'poll'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    MessagePoll,
    PollDetail {}

/**
 * Message is a venue.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message'`
 * @eventType `'venue'`
 */
export interface VenueMessageEvent
  extends EventObject<'message', 'venue'>,
    EventBase,
    Message,
    MessageDetail,
    Venue {}

/**
 * Message is a venue.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post'`
 * @eventType `'venue'`
 */
export interface VenueChannelPostEvent
  extends EventObject<'channel_post', 'venue'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Venue {}

/**
 * Message is a shared location.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'message'`
 * @eventType `'location'`
 */
export interface LocationMessageEvent
  extends EventObject<'message', 'location'>,
    EventBase,
    Message,
    MessageDetail,
    Location {}

/**
 * Message is a shared location.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'channel_post'`
 * @eventType `'location'`
 */
export interface LocationChannelPostEvent
  extends EventObject<'channel_post', 'location'>,
    EventBase,
    ChannelPost,
    MessageDetail,
    Location {}

/**
 * New members were added to the group or supergroup.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'action'`
 * @eventType `'new_chat_members'`
 */
export interface NewChatMembersEvent
  extends EventObject<'action', 'new_chat_members'>,
    EventBase,
    Message,
    MessageDetail,
    NewChatMembers {}

/**
 * A member was removed from the group.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'action'`
 * @eventType `'left_chat_member'`
 */
export interface LeftChatMemberEvent
  extends EventObject<'action', 'left_chat_member'>,
    EventBase,
    Message,
    MessageDetail,
    LeftChatMember {}

/**
 * The chat title was changed
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'action'`
 * @eventType `'new_chat_title'`
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
 * @eventCategory `'action'`
 * @eventType `'new_chat_photo'`
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
 * @eventCategory `'action'`
 * @eventType `'delete_chat_photo'`
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
 * @eventCategory `'action'`
 * @eventType `'create_group_chat'`
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
 * @eventCategory `'action'`
 * @eventType `'migrate_to_chat'`
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
 * @eventCategory `'action'`
 * @eventType `'migrate_from_chat'`
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
 * @eventCategory `'action'`
 * @eventType `'pin_message'`
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
 * @eventCategory `'postback'`
 * @eventType `'successful_payment'`
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
 * @eventCategory `'postback'`
 * @eventType `'inline_query'`
 */
export interface InlineQueryEvent
  extends EventObject<'postback', 'inline_query'>,
    EventBase,
    InlineQuery {}

/**
 * The result of an inline query that was chosen by a user and sent to their chat partner.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#choseninlineresult).
 * @eventCategory `'postback'`
 * @eventType `'choose_inline_result'`
 */
export interface ChooseInlineResultEvent
  extends EventObject<'postback', 'choose_inline_result'>,
    EventBase,
    ChosenInlineResult {}

/**
 * New incoming callback query.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#callbackquery).
 * @eventCategory `'postback'`
 * @eventType `'callback_query'`
 */
export interface CallbackQueryEvent
  extends EventObject<'postback', 'callback_query'>,
    EventBase,
    CallbackQuery {}

/**
 * New incoming shipping query. Only for invoices with flexible price.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#shippingquery).
 * @eventCategory `'postback'`
 * @eventType `'shipping_query'`
 */
export interface ShippingQueryEvent
  extends EventObject<'postback', 'shipping_query'>,
    EventBase,
    ShippingQuery {}

/**
 * New incoming pre-checkout query. Contains full information about checkout.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#precheckoutquery).
 * @eventCategory `'postback'`
 * @eventType `'pre_checkout_query'`
 */
export interface PreCheckoutQueryEvent
  extends EventObject<'postback', 'pre_checkout_query'>,
    EventBase,
    PreCheckoutQuery {}

/**
 * New poll state. Bots receive only updates about stopped polls and polls, which are sent by the bot.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#poll).
 * @eventCategory `'postback'`
 * @eventType `'poll_change'`
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
 * @eventCategory `'postback'`
 * @eventType `'poll_answer_change'`
 */
export interface PollAnswerChangeEvent
  extends EventObject<'postback', 'poll_answer_change'>,
    EventBase,
    PollAnswer {}

/**
 * The bot's chat member status was updated in a chat. For private chats, this update is received only when the bot is blocked or unblocked by the user.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#update).
 * @eventCategory `'action'`
 * @eventType `'bot_member_updated'`
 */
export interface BotMemberUpdatedEvent
  extends EventObject<'action', 'bot_member_updated'>,
    EventBase,
    ChatMember,
    ChatMemberUpdated {}

/**
 * A chat member's status was updated in a chat. The bot must be an administrator in the chat and must explicitly specify “chat_member” in the list of allowed_updates to receive these updates.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#update).
 * @eventCategory `'action'`
 * @eventType `'chat_member_updated'`
 */
export interface ChatMemberUpdatedEvent
  extends EventObject<'action', 'chat_member_updated'>,
    EventBase,
    ChatMember,
    ChatMemberUpdated {}

/**
 * An unknown message met.
 * @category Event
 * @guides Check official [reference](https://core.telegram.org/bots/api#message).
 * @eventCategory `'unknown'`
 * @eventType `'unknown'`
 */
export interface UnknownEvent
  extends EventObject<'unknown', 'unknown'>,
    EventBase,
    Unknown {}

/**
 * @category Event
 */
export type TelegramEvent =
  | TextMessageEvent
  | TextChannelPostEvent
  | AnimationMessageEvent
  | AnimationChannelPostEvent
  | AudioMessageEvent
  | AudioChannelPostEvent
  | DocumentMessageEvent
  | DocumentChannelPostEvent
  | PhotoMessageEvent
  | PhotoChannelPostEvent
  | StickerMessageEvent
  | StickerChannelPostEvent
  | VideoMessageEvent
  | VideoChannelPostEvent
  | VideoNoteMessageEvent
  | VideoNoteChannelPostEvent
  | VoiceMessageEvent
  | VoiceChannelPostEvent
  | ContactMessageEvent
  | ContactChannelPostEvent
  | DiceMessageEvent
  | DiceChannelPostEvent
  | GameMessageEvent
  | PollMessageEvent
  | PollChannelPostEvent
  | VenueMessageEvent
  | VenueChannelPostEvent
  | LocationMessageEvent
  | LocationChannelPostEvent
  | NewChatMembersEvent
  | LeftChatMemberEvent
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
  | BotMemberUpdatedEvent
  | ChatMemberUpdatedEvent
  | UnknownEvent;
