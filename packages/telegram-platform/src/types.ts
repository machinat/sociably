/* eslint-disable camelcase */
import type { Readable } from 'stream';
import type {
  PlatformUtilities,
  EventMiddleware,
  DispatchMiddleware,
  SociablyNode,
  NativeComponent,
} from '@sociably/core';
import { IntermediateSegment, UnitSegment } from '@sociably/core/renderer';
import { DispatchFrame, DispatchResponse } from '@sociably/core/engine';
import { Interfaceable } from '@sociably/core/service';
import type { WebhookMetadata } from '@sociably/http/webhook';
import type { TelegramEvent } from './event/events.js';
import { AgentSettingsAccessorI } from './interface.js';
import type TelegramChat from './Chat.js';
import type { TelegramBot } from './Bot.js';

export * from './event/events.js';

export type TelegramChatType = 'private' | 'group' | 'supergroup' | 'channel';
export type TelegramParseMode = 'HTML' | 'MarkdownV2' | 'Markdown' | 'None';

export type RawUser = {
  /**
   * Unique identifier for this user or bot. This number may have more than 32
   * significant bits and some programming languages may have difficulty/silent
   * defects in interpreting it. But it has at most 52 significant bits, so a
   * 64-bit integer or double-precision float type are safe for storing this
   * identifier.
   */
  id: number;
  /** True, if this user is a bot */
  is_bot: boolean;
  /** User's or bot's first name */
  first_name: string;
  /** User's or bot's last name */
  last_name?: string;
  /** User's or bot's username */
  username?: string;
  /** IETF language tag of the user's language */
  language_code?: string;
  /** True, if this user is a Telegram Premium user */
  is_premium?: boolean;
  /** True, if this user added the bot to the attachment menu */
  added_to_attachment_menu?: boolean;
  /** True, if the bot can be invited to groups. Returned only in getMe. */
  can_join_groups?: boolean;
  /** True, if privacy mode is disabled for the bot. Returned only in getMe. */
  can_read_all_group_messages?: boolean;
  /** True, if the bot supports inline queries. Returned only in getMe. */
  supports_inline_queries?: boolean;
  /**
   * True, if the bot can be connected to a Telegram Business account to receive
   * its messages. Returned only in getMe.
   */
  can_connect_to_business?: boolean;
  /** True, if the bot has a main Web App. Returned only in getMe. */
  has_main_web_app?: boolean;
};

export type RawChat = {
  /**
   * Unique identifier for this chat. This number may have more than 32
   * significant bits and some programming languages may have difficulty/silent
   * defects in interpreting it. But it has at most 52 significant bits, so a
   * signed 64-bit integer or double-precision float type are safe for storing
   * this identifier.
   */
  id: number;
  /**
   * Type of the chat, can be either "private", "group", "supergroup" or
   * "channel"
   */
  type: TelegramChatType;
  /** Title, for supergroups, channels and group chats */
  title?: string;
  /** Username, for private chats, supergroups and channels if available */
  username?: string;
  /** First name of the other party in a private chat */
  first_name?: string;
  /** Last name of the other party in a private chat */
  last_name?: string;
  /** True, if the supergroup chat is a forum (has topics enabled) */
  is_forum?: boolean;
  /** True, if the chat is the direct messages chat of a channel */
  is_direct_messages?: boolean;
  /** Description, for groups, supergroups and channel chats */
  description?: string;
  /** Bio of the other party in a private chat */
  bio?: string;
};

export type RawMessage = {
  /** Unique message identifier inside this chat */
  message_id: number;
  /**
   * Unique identifier of a message thread to which the message belongs; for
   * supergroups only
   */
  message_thread_id?: number;
  /**
   * If the message is a direct message, information about the direct messages
   * topic
   */
  direct_messages_topic?: RawDirectMessagesTopic;
  /** Sender of the message; empty for messages sent to channels */
  from?: RawUser;
  /** Sender of the message, sent on behalf of a chat */
  sender_chat?: RawChat;
  /**
   * If the sender of the message boosted the chat, the number of boosts added
   * by the user
   */
  sender_boost_count?: number;
  /** The bot that actually sent the message on behalf of the business account */
  sender_business_bot?: RawUser;
  /** Date the message was sent in Unix time */
  date: number;
  /**
   * Unique identifier of the business connection from which the message was
   * received
   */
  business_connection_id?: string;
  /** Chat the message belongs to */
  chat: RawChat;
  /** Information about the original message for forwarded messages */
  forward_origin?: RawMessageOrigin;
  /** True, if the message is sent to a forum topic */
  is_topic_message?: boolean;
  /**
   * True, if the message is a channel post that was automatically forwarded to
   * the connected discussion group
   */
  is_automatic_forward?: boolean;
  /**
   * For replies, the original message. Note that the Message object in this
   * field will not contain further reply_to_message fields even if it is itself
   * a reply
   */
  reply_to_message?: RawMessage;
  /**
   * Information about the message that is being replied to, which may come from
   * another chat or forum topic
   */
  external_reply?: RawExternalReplyInfo;
  /**
   * For replies that quote part of the original message, the quoted part of the
   * message
   */
  quote?: RawTextQuote;
  /** Message is a reply to a story */
  reply_to_story?: RawStory;
  /** For replies to a checklist task, the identifier of the task */
  reply_to_checklist_task_id?: number;
  /** Bot through which the message was sent */
  via_bot?: RawUser;
  /** Date the message was last edited in Unix time */
  edit_date?: number;
  /** True, if the message can't be forwarded */
  has_protected_content?: boolean;
  /**
   * True, if the message was sent by an implicit action, for example, as an
   * away or a greeting business message
   */
  is_from_offline?: boolean;
  /**
   * True, if the message is a channel post that requires payment from
   * subscribers
   */
  is_paid_post?: boolean;
  /** The unique identifier of a media message group this message belongs to */
  media_group_id?: string;
  /**
   * Signature of the post author for messages in channels, or the custom title
   * of an anonymous group administrator
   */
  author_signature?: string;
  /** Amount of Telegram Stars associated with the paid post */
  paid_star_count?: number;
  /** For text messages, the actual UTF-8 text of the message */
  text?: string;
  entities?: RawMessageEntity[];
  link_preview_options?: RawLinkPreviewOptions;
  suggested_post_info?: RawSuggestedPostInfo;
  effect_id?: string;
  animation?: RawAnimation;
  audio?: RawAudio;
  document?: RawDocument;
  paid_media?: RawPaidMediaInfo;
  photo?: RawPhotoSize[];
  sticker?: RawSticker;
  story?: RawStory;
  video?: RawVideo;
  video_note?: RawVideoNote;
  voice?: RawVoice;
  caption?: string;
  caption_entities?: RawMessageEntity[];
  show_caption_above_media?: boolean;
  has_media_spoiler?: boolean;
  checklist?: RawChecklist;
  contact?: RawContact;
  dice?: RawDice;
  game?: RawGame;
  poll?: RawPoll;
  venue?: RawVenue;
  location?: RawLocation;
  new_chat_members?: RawUser[];
  left_chat_member?: RawUser;
  new_chat_title?: string;
  new_chat_photo?: RawPhotoSize[];
  delete_chat_photo?: boolean;
  group_chat_created?: boolean;
  /** True, if the supergroup has been created */
  supergroup_chat_created?: boolean;
  /** True, if the channel has been created */
  channel_chat_created?: boolean;
  /** Service message: auto-delete timer settings changed in the chat */
  message_auto_delete_timer_changed?: RawMessageAutoDeleteTimerChanged;
  migrate_to_chat_id?: number;
  /** The supergroup has been migrated from a group with the specified identifier */
  migrate_from_chat_id?: number;
  /** Specified message was pinned */
  pinned_message?: RawMaybeInaccessibleMessage;
  invoice?: RawInvoice;
  /** Message is a service message about a successful payment */
  successful_payment?: RawSuccessfulPayment;
  /** Message is a service message about a refunded payment */
  refunded_payment?: RawRefundedPayment;
  /** Service message: users were shared with the bot */
  users_shared?: RawUsersShared;
  chat_shared?: RawChatShared;
  gift?: RawGiftInfo;
  unique_gift?: RawUniqueGiftInfo;
  connected_website?: string;
  write_access_allowed?: RawWriteAccessAllowed;
  passport_data?: RawPassportData;
  proximity_alert_triggered?: RawProximityAlertTriggered;
  boost_added?: RawChatBoostAdded;
  chat_background_set?: RawChatBackground;
  checklist_tasks_done?: RawChecklistTasksDone;
  checklist_tasks_added?: RawChecklistTasksAdded;
  direct_message_price_changed?: RawDirectMessagePriceChanged;
  forum_topic_created?: RawForumTopicCreated;
  forum_topic_edited?: RawForumTopicEdited;
  forum_topic_closed?: RawForumTopicClosed;
  forum_topic_reopened?: RawForumTopicReopened;
  general_forum_topic_hidden?: RawGeneralForumTopicHidden;
  general_forum_topic_unhidden?: RawGeneralForumTopicUnhidden;
  giveaway_created?: RawGiveawayCreated;
  giveaway?: RawGiveaway;
  giveaway_winners?: RawGiveawayWinners;
  giveaway_completed?: RawGiveawayCompleted;
  paid_message_price_changed?: RawPaidMessagePriceChanged;
  suggested_post_approved?: RawSuggestedPostApproved;
  suggested_post_approval_failed?: RawSuggestedPostApprovalFailed;
  suggested_post_declined?: RawSuggestedPostDeclined;
  suggested_post_paid?: RawSuggestedPostPaid;
  suggested_post_refunded?: RawSuggestedPostRefunded;
  video_chat_scheduled?: RawVideoChatScheduled;
  video_chat_started?: RawVideoChatStarted;
  video_chat_ended?: RawVideoChatEnded;
  video_chat_participants_invited?: RawVideoChatParticipantsInvited;
  web_app_data?: RawWebAppData;
  reply_markup?: RawInlineKeyboardMarkup;
};

export type RawInlineQuery = {
  /** Unique identifier for this query */
  id: string;
  /** Sender */
  from: RawUser;
  /** Text of the query (up to 256 characters) */
  query: string;
  /** Offset of the results to be returned, can be controlled by the bot */
  offset: string;
  /**
   * Type of the chat from which the inline query was sent. Can be either
   * "sender" for a private chat with the inline query sender, "private",
   * "group", "supergroup", or "channel".
   */
  chat_type?: string;
  /** Sender location, only for bots that request user location */
  location?: RawLocation;
};

export type RawChosenInlineResult = {
  /** The unique identifier for the result that was chosen */
  result_id: string;
  /** The user that chose the result */
  from: RawUser;
  /** Sender location, only for bots that request user location */
  location?: RawLocation;
  /**
   * Identifier of the sent inline message. Available only if there is an inline
   * keyboard attached to the message. Will be also received in callback queries
   * and can be used to edit the message.
   */
  inline_message_id?: string;
  /** The query that was used to obtain the result */
  query: string;
};

export type RawCallbackQuery = {
  /** Unique identifier for this query */
  id: string;
  /** Sender */
  from: RawUser;
  /** Message sent by the bot with the callback button that originated the query */
  message?: RawMaybeInaccessibleMessage;
  /**
   * Identifier of the message sent via the bot in inline mode, that originated
   * the query.
   */
  inline_message_id?: string;
  /**
   * Global identifier, uniquely corresponding to the chat to which the message
   * with the callback button was sent. Useful for high scores in games.
   */
  chat_instance: string;
  /**
   * Data associated with the callback button. Be aware that the message
   * originated the query can contain no callback buttons with this data.
   */
  data?: string;
  /**
   * Short name of a Game to be returned, serves as the unique identifier for
   * the game
   */
  game_short_name?: string;
};

export type RawShippingQuery = {
  /** Unique query identifier */
  id: string;
  /** User who sent the query */
  from: RawUser;
  /** Bot-specified invoice payload */
  invoice_payload: string;
  /** User specified shipping address */
  shipping_address: RawShippingAddress;
};

export type RawPreCheckoutQuery = {
  /** Unique query identifier */
  id: string;
  /** User who sent the query */
  from: RawUser;
  /**
   * Three-letter ISO 4217 currency code, or "XTR" for payments in Telegram
   * Stars
   */
  currency: string;
  /**
   * Total price in the smallest units of the currency (integer, not
   * float/double). For example, for a price of US$ 1.45 pass amount = 145. See
   * the exp parameter in currencies.json, it shows the number of digits past
   * the decimal point for each currency (2 for the majority of currencies).
   */
  total_amount: number;
  /** Bot-specified invoice payload */
  invoice_payload: string;
  /** Identifier of the shipping option chosen by the user */
  shipping_option_id?: string;
  /** Order information provided by the user */
  order_info?: RawOrderInfo;
};

export type RawPoll = {
  /** Unique poll identifier */
  id: string;
  /** Poll question, 1-300 characters */
  question: string;
  /**
   * Special entities that appear in the question. Currently, only custom emoji
   * entities are allowed in poll questions
   */
  question_entities?: RawMessageEntity[];
  /** List of poll options */
  options: RawPollOption[];
  /** Total number of users that voted in the poll */
  total_voter_count: number;
  /** True, if the poll is closed */
  is_closed: boolean;
  /** True, if the poll is anonymous */
  is_anonymous: boolean;
  /** Poll type, currently can be "regular" or "quiz" */
  type: string;
  /** True, if the poll allows multiple answers */
  allows_multiple_answers: boolean;
  /**
   * 0-based identifier of the correct answer option. Available only for polls
   * in the quiz mode, which are closed, or was sent (not forwarded) by the bot
   * or to the private chat with the bot.
   */
  correct_option_id?: number;
  /**
   * Text that is shown when a user chooses an incorrect answer or taps on the
   * lamp icon in a quiz-style poll, 0-200 characters
   */
  explanation?: string;
  /**
   * Special entities like usernames, URLs, bot commands, etc. that appear in
   * the explanation
   */
  explanation_entities?: RawMessageEntity[];
  /** Amount of time in seconds the poll will be active after creation */
  open_period?: number;
  /** Point in time (Unix timestamp) when the poll will be automatically closed */
  close_date?: number;
};

export type RawPollAnswer = {
  /** Unique poll identifier */
  poll_id: string;
  /** The chat that changed the answer to the poll, if the voter is anonymous */
  voter_chat?: RawChat;
  /** The user that changed the answer to the poll, if the voter isn't anonymous */
  user?: RawUser;
  /**
   * 0-based identifiers of chosen answer options. May be empty if the vote was
   * retracted.
   */
  option_ids: number[];
};

export type RawFile = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
  file_name?: string;
  mime_type?: string;
  thumbnail?: RawPhotoSize;
};

export type RawPhotoSize = {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /**
   * Unique identifier for this file, which is supposed to be the same over time
   * and for different bots. Can't be used to download or reuse the file.
   */
  file_unique_id: string;
  /** Photo width */
  width: number;
  /** Photo height */
  height: number;
  /** File size in bytes */
  file_size?: number;
};

export type RawAnimation = {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /**
   * Unique identifier for this file, which is supposed to be the same over time
   * and for different bots. Can't be used to download or reuse the file.
   */
  file_unique_id: string;
  /** Video width as defined by the sender */
  width: number;
  /** Video height as defined by the sender */
  height: number;
  /** Duration of the video in seconds as defined by the sender */
  duration: number;
  /** Animation thumbnail as defined by the sender */
  thumbnail?: RawPhotoSize;
  /** Original animation filename as defined by the sender */
  file_name?: string;
  /** MIME type of the file as defined by the sender */
  mime_type?: string;
  /**
   * File size in bytes. It can be bigger than 2^31 and some programming
   * languages may have difficulty/silent defects in interpreting it. But it has
   * at most 52 significant bits, so a signed 64-bit integer or double-precision
   * float type are safe for storing this value.
   */
  file_size?: number;
};

export type RawAudio = {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /**
   * Unique identifier for this file, which is supposed to be the same over time
   * and for different bots. Can't be used to download or reuse the file.
   */
  file_unique_id: string;
  /** Duration of the audio in seconds as defined by the sender */
  duration: number;
  /** Performer of the audio as defined by the sender or by audio tags */
  performer?: string;
  /** Title of the audio as defined by the sender or by audio tags */
  title?: string;
  /** Original filename as defined by the sender */
  file_name?: string;
  /** MIME type of the file as defined by the sender */
  mime_type?: string;
  /**
   * File size in bytes. It can be bigger than 2^31 and some programming
   * languages may have difficulty/silent defects in interpreting it. But it has
   * at most 52 significant bits, so a signed 64-bit integer or double-precision
   * float type are safe for storing this value.
   */
  file_size?: number;
  /** Thumbnail of the album cover to which the music file belongs */
  thumbnail?: RawPhotoSize;
};

export type RawVideo = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: RawPhotoSize;
  cover?: RawPhotoSize[];
  start_timestamp?: number;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type RawVideoNote = {
  file_id: string;
  file_unique_id: string;
  length: number;
  duration: number;
  thumbnail?: RawPhotoSize;
  file_size?: number;
};

export type RawVoice = {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
};

export type RawDocument = {
  file_id: string;
  file_unique_id: string;
  thumbnail?: RawPhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type RawSticker = {
  file_id: string;
  file_unique_id: string;
  type: string;
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  thumbnail?: RawPhotoSize;
  emoji?: string;
  set_name?: string;
  premium_animation?: RawFile;
  mask_position?: RawMaskPosition;
  custom_emoji_id?: string;
  needs_repainting?: boolean;
  file_size?: number;
};

export type RawContact = {
  /** Contact's phone number */
  phone_number: string;
  /** Contact's first name */
  first_name: string;
  /** Contact's last name */
  last_name?: string;
  /**
   * Contact's user identifier in Telegram. This number may have more than 32
   * significant bits and some programming languages may have difficulty/silent
   * defects in interpreting it. But it has at most 52 significant bits, so a
   * 64-bit integer or double-precision float type are safe for storing this
   * identifier.
   */
  user_id?: number;
  /** Additional data about the contact in the form of a vCard */
  vcard?: string;
};

export type RawGame = {
  title: string;
  description: string;
  photo: RawPhotoSize[];
  text?: string;
  text_entities?: RawMessageEntity[];
  animation?: RawAnimation;
};

export type RawDice = {
  /** Emoji on which the dice throw animation is based */
  emoji: string;
  /**
   * Value of the dice, 1-6 for "🎲", "🎯" and "🎳" base emoji, 1-5 for "🏀" and
   * "⚽" base emoji, 1-64 for "🎰" base emoji
   */
  value: number;
};

export type RawPollOption = {
  /** Option text, 1-100 characters */
  text: string;
  /**
   * Special entities that appear in the option text. Currently, only custom
   * emoji entities are allowed in poll option texts
   */
  text_entities?: RawMessageEntity[];
  /** Number of users that voted for this option */
  voter_count: number;
};

export type RawLocation = {
  /** Latitude as defined by the sender */
  latitude: number;
  /** Longitude as defined by the sender */
  longitude: number;
  /** The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: number;
  /**
   * Time relative to the message sending date, during which the location can be
   * updated; in seconds. For active live locations only.
   */
  live_period?: number;
  /**
   * The direction in which user is moving, in degrees; 1-360. For active live
   * locations only.
   */
  heading?: number;
  /**
   * The maximum distance for proximity alerts about approaching another chat
   * member, in meters. For sent live locations only.
   */
  proximity_alert_radius?: number;
};

export type RawVenue = {
  location: RawLocation;
  title: string;
  address: string;
  foursquare_id?: string;
  foursquare_type?: string;
  google_place_id?: string;
  google_place_type?: string;
};

export type RawInvoice = {
  title: string;
  description: string;
  start_parameter: string;
  currency: string;
  total_amount: number;
};

export type RawMessageEntity = {
  /**
   * Type of the entity. Currently, can be "mention" (@username), "hashtag"
   * (#hashtag), "cashtag" ($USD), "bot_command" (/start@jobs_bot), "url"
   * (https://telegram.org), "email" (do-not-reply@telegram.org), "phone_number"
   * (+1-212-555-0123), "bold" (bold text), "italic" (italic text), "underline"
   * (underlined text), "strikethrough" (strikethrough text), "spoiler" (spoiler
   * message), "blockquote" (block quotation), "expandable_blockquote"
   * (collapsed-by-default block quotation), "code" (monowidth string), "pre"
   * (monowidth block), "text_link" (for clickable text URLs), "text_mention"
   * (for users without usernames), "custom_emoji" (for inline custom emoji
   * stickers)
   */
  type: string;
  /** Offset in UTF-16 code units to the start of the entity */
  offset: number;
  /** Length of the entity in UTF-16 code units */
  length: number;
  /** For "text_link" only, URL that will be opened after user taps on the text */
  url?: string;
  /** For "text_mention" only, the mentioned user */
  user?: RawUser;
  /** For "pre" only, the programming language of the entity text */
  language?: string;
  /**
   * For "custom_emoji" only, unique identifier of the custom emoji. Use
   * getCustomEmojiStickers to get full information about the sticker
   */
  custom_emoji_id?: string;
};

export type RawMaskPosition = {
  point: string;
  x_shift: number;
  y_shift: number;
  scale: number;
};

export type RawPassportData = {
  data: RawEncryptedPassportElement[];
  credentials: RawEncryptedCredentials;
};

export type RawInlineKeyboardMarkup = {
  inline_keyboard: RawInlineKeyboardButton[][];
};

export type RawSuccessfulPayment = {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  subscription_expiration_date?: number;
  is_recurring?: boolean;
  is_first_recurring?: boolean;
  shipping_option_id?: string;
  order_info?: RawOrderInfo;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
};

export type RawShippingAddress = {
  country_code: string;
  state: string;
  city: string;
  street_line1: string;
  street_line2: string;
  post_code: string;
};

export type RawOrderInfo = {
  name?: string;
  phone_number?: string;
  email?: string;
  shipping_address?: RawShippingAddress;
};

export type RawChatMember = {
  user: RawUser;
  status:
    | 'creator'
    | 'administrator'
    | 'member'
    | 'restricted'
    | 'left'
    | 'kicked';
  custom_title?: string;
  is_anonymous?: boolean;
  until_date?: number;
  can_be_edited?: boolean;
  can_manage_chat?: boolean;
  can_change_info?: boolean;
  can_delete_messages?: boolean;
  can_invite_users?: boolean;
  can_restrict_members?: boolean;
  can_pin_messages?: boolean;
  can_manage_topics?: boolean;
  can_promote_members?: boolean;
  can_manage_video_chats?: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_post_stories?: boolean;
  can_edit_stories?: boolean;
  can_delete_stories?: boolean;
  can_manage_direct_messages?: boolean;
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  is_member?: boolean;
};

export type RawChatMemberUpdated = {
  chat: RawChat;
  from: RawUser;
  date: number;
  old_chat_member: RawChatMember;
  new_chat_member: RawChatMember;
  invite_link?: RawChatInviteLink;
  via_join_request?: boolean;
  via_chat_folder_invite_link?: boolean;
};

// Additional type definitions following the API spec
export type RawTextQuote = {
  text: string;
  entities?: RawMessageEntity[];
  position: number;
  is_manual?: boolean;
};

export type RawExternalReplyInfo = {
  origin: RawMessageOrigin;
  chat?: RawChat;
  message_id?: number;
  link_preview_options?: RawLinkPreviewOptions;
  animation?: RawAnimation;
  audio?: RawAudio;
  document?: RawDocument;
  paid_media?: RawPaidMediaInfo;
  photo?: RawPhotoSize[];
  sticker?: RawSticker;
  story?: RawStory;
  video?: RawVideo;
  video_note?: RawVideoNote;
  voice?: RawVoice;
  has_media_spoiler?: boolean;
  checklist?: RawChecklist;
  contact?: RawContact;
  dice?: RawDice;
  game?: RawGame;
  giveaway?: RawGiveaway;
  giveaway_winners?: RawGiveawayWinners;
  invoice?: RawInvoice;
  location?: RawLocation;
  poll?: RawPoll;
  venue?: RawVenue;
};

export type RawMessageOrigin =
  | RawMessageOriginUser
  | RawMessageOriginHiddenUser
  | RawMessageOriginChat
  | RawMessageOriginChannel;

export type RawMessageOriginUser = {
  type: 'user';
  date: number;
  sender_user: RawUser;
};

export type RawMessageOriginHiddenUser = {
  type: 'hidden_user';
  date: number;
  sender_user_name: string;
};

export type RawMessageOriginChat = {
  type: 'chat';
  date: number;
  sender_chat: RawChat;
  author_signature?: string;
};

export type RawMessageOriginChannel = {
  type: 'channel';
  date: number;
  chat: RawChat;
  message_id: number;
  author_signature?: string;
};

export type RawStory = {
  chat: RawChat;
  id: number;
};

export type RawMaybeInaccessibleMessage = RawMessage | RawInaccessibleMessage;

export type RawInaccessibleMessage = {
  chat: RawChat;
  message_id: number;
  date: 0;
};

export type RawLinkPreviewOptions = {
  is_disabled?: boolean;
  url?: string;
  prefer_small_media?: boolean;
  prefer_large_media?: boolean;
  show_above_text?: boolean;
};

export type RawSuggestedPostInfo = {
  state: string;
  price?: RawSuggestedPostPrice;
  send_date?: number;
};

export type RawSuggestedPostPrice = {
  currency: string;
  amount: number;
};

export type RawPaidMediaInfo = {
  star_count: number;
  paid_media: RawPaidMedia[];
};

export type RawPaidMedia =
  | RawPaidMediaPreview
  | RawPaidMediaPhoto
  | RawPaidMediaVideo;

export type RawPaidMediaPreview = {
  type: 'preview';
  width?: number;
  height?: number;
  duration?: number;
};

export type RawPaidMediaPhoto = {
  type: 'photo';
  photo: RawPhotoSize[];
};

export type RawPaidMediaVideo = {
  type: 'video';
  video: RawVideo;
};

export type RawChecklist = {
  title: string;
  title_entities?: RawMessageEntity[];
  tasks: RawChecklistTask[];
  others_can_add_tasks?: boolean;
  others_can_mark_tasks_as_done?: boolean;
};

export type RawChecklistTask = {
  id: number;
  text: string;
  text_entities?: RawMessageEntity[];
  completed_by_user?: RawUser;
  completion_date?: number;
};

// Service message types
export type RawMessageAutoDeleteTimerChanged = {
  message_auto_delete_time: number;
};

export type RawRefundedPayment = {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id?: string;
};

export type RawUsersShared = {
  request_id: number;
  users: RawSharedUser[];
};

export type RawSharedUser = {
  user_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo?: RawPhotoSize[];
};

export type RawChatShared = {
  request_id: number;
  chat_id: number;
  title?: string;
  username?: string;
  photo?: RawPhotoSize[];
};

export type RawGiftInfo = {
  gift: RawGift;
  owned_gift_id?: string;
  convert_star_count?: number;
  prepaid_upgrade_star_count?: number;
  can_be_upgraded?: boolean;
  text?: string;
  entities?: RawMessageEntity[];
  is_private?: boolean;
};

export type RawGift = {
  id: string;
  sticker: RawSticker;
  star_count: number;
  upgrade_star_count?: number;
  total_count?: number;
  remaining_count?: number;
  publisher_chat?: RawChat;
};

export type RawUniqueGiftInfo = {
  gift: RawUniqueGift;
  origin: string;
  last_resale_star_count?: number;
  owned_gift_id?: string;
  transfer_star_count?: number;
  next_transfer_date?: number;
};

export type RawUniqueGift = {
  base_name: string;
  name: string;
  number: number;
  model: RawUniqueGiftModel;
  symbol: RawUniqueGiftSymbol;
  backdrop: RawUniqueGiftBackdrop;
  publisher_chat?: RawChat;
};

export type RawUniqueGiftModel = Record<string, unknown>; // Complex 3D model data
export type RawUniqueGiftSymbol = Record<string, unknown>; // Symbol data
export type RawUniqueGiftBackdrop = Record<string, unknown>; // Backdrop data

export type RawWriteAccessAllowed = {
  from_request?: boolean;
  web_app_name?: string;
  from_attachment_menu?: boolean;
};

export type RawProximityAlertTriggered = {
  traveler: RawUser;
  watcher: RawUser;
  distance: number;
};

export type RawChatBoostAdded = {
  boost_count: number;
};

export type RawChatBackground = Record<string, unknown>; // Chat background data

export type RawChecklistTasksDone = {
  checklist_message?: RawMessage;
  marked_as_done_task_ids?: number[];
  marked_as_not_done_task_ids?: number[];
};

export type RawChecklistTasksAdded = {
  checklist_message?: RawMessage;
  tasks: RawChecklistTask[];
};

export type RawDirectMessagePriceChanged = {
  are_direct_messages_enabled: boolean;
  direct_message_star_count?: number;
};

export type RawForumTopicCreated = {
  name: string;
  icon_color: number;
  icon_custom_emoji_id?: string;
};

export type RawForumTopicEdited = {
  name?: string;
  icon_custom_emoji_id?: string;
};

export type RawForumTopicClosed = Record<string, never>;
export type RawForumTopicReopened = Record<string, never>;
export type RawGeneralForumTopicHidden = Record<string, never>;
export type RawGeneralForumTopicUnhidden = Record<string, never>;

export type RawGiveawayCreated = Record<string, never>;

export type RawGiveaway = {
  chats: RawChat[];
  winners_selection_date: number;
  winner_count: number;
  only_new_members?: boolean;
  has_public_winners?: boolean;
  prize_description?: string;
  country_codes?: string[];
  premium_period_months?: number;
  prize_star_count?: number;
};

export type RawGiveawayWinners = {
  chat: RawChat;
  giveaway_message_id: number;
  winners_selection_date: number;
  winner_count: number;
  winners: RawUser[];
  additional_chat_count?: number;
  premium_period_months?: number;
  unclaimed_prize_count?: number;
  only_new_members?: boolean;
  was_refunded?: boolean;
  prize_description?: string;
  prize_star_count?: number;
};

export type RawGiveawayCompleted = {
  winner_count: number;
  unclaimed_prize_count?: number;
  giveaway_message?: RawMessage;
  is_star_giveaway?: boolean;
};

export type RawPaidMessagePriceChanged = {
  paid_message_star_count: number;
};

export type RawSuggestedPostApproved = {
  suggested_post_message?: RawMessage;
  price?: RawSuggestedPostPrice;
  send_date: number;
};

export type RawSuggestedPostApprovalFailed = Record<string, never>;
export type RawSuggestedPostDeclined = Record<string, never>;
export type RawSuggestedPostPaid = Record<string, never>;
export type RawSuggestedPostRefunded = Record<string, never>;

export type RawVideoChatScheduled = {
  start_date: number;
};

export type RawVideoChatStarted = Record<string, never>;

export type RawVideoChatEnded = {
  duration: number;
};

export type RawVideoChatParticipantsInvited = {
  users: RawUser[];
};

export type RawWebAppData = {
  data: string;
  button_text: string;
};

export type RawInlineKeyboardButton = {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: RawWebAppInfo;
  login_url?: RawLoginUrl;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  switch_inline_query_chosen_chat?: RawSwitchInlineQueryChosenChat;
  copy_text?: RawCopyTextButton;
  callback_game?: RawCallbackGame;
  pay?: boolean;
};

export type RawWebAppInfo = {
  url: string;
};

export type RawLoginUrl = {
  url: string;
  forward_text?: string;
  bot_username?: string;
  request_write_access?: boolean;
};

export type RawSwitchInlineQueryChosenChat = {
  query?: string;
  allow_user_chats?: boolean;
  allow_bot_chats?: boolean;
  allow_group_chats?: boolean;
  allow_channel_chats?: boolean;
};

export type RawCopyTextButton = {
  text: string;
};

export type RawCallbackGame = Record<string, never>;

export type RawChatInviteLink = {
  invite_link: string;
  creator: RawUser;
  creates_join_request: boolean;
  is_primary: boolean;
  is_revoked: boolean;
  name?: string;
  expire_date?: number;
  member_limit?: number;
  pending_join_request_count?: number;
  subscription_period?: number;
  subscription_price?: number;
};

export type RawEncryptedPassportElement = Record<string, unknown>; // Encrypted passport element
export type RawEncryptedCredentials = Record<string, unknown>; // Encrypted credentials

export type RawDirectMessagesTopic = {
  topic_id: number;
  user?: RawUser;
};

export type TelegramRawEvent = {
  /**
   * The update's unique identifier. Update identifiers start from a certain
   * positive number and increase sequentially. This ID becomes especially handy
   * if you're using Webhooks, since it allows you to ignore repeated updates or
   * to restore the correct update sequence, should they get out of order. If
   * there are no new updates for at least a week, then identifier of the next
   * update will be chosen randomly instead of sequentially.
   */
  update_id: number;
  /** New incoming message of any kind — text, photo, sticker, etc. */
  message?: RawMessage;
  /** New version of a message that is known to the bot and was edited */
  edited_message?: RawMessage;
  /** New incoming channel post of any kind — text, photo, sticker, etc. */
  channel_post?: RawMessage;
  /** New version of a channel post that is known to the bot and was edited */
  edited_channel_post?: RawMessage;
  /**
   * The bot was connected to or disconnected from a business account, or a user
   * edited an existing connection with the bot
   */
  business_connection?: RawBusinessConnection;
  /** New message from a connected business account */
  business_message?: RawMessage;
  /** New version of a message from a connected business account */
  edited_business_message?: RawMessage;
  /** Messages were deleted from a connected business account */
  deleted_business_messages?: RawBusinessMessagesDeleted;
  /**
   * A reaction to a message was changed by a user. The bot must be an
   * administrator in the chat and must explicitly specify "message_reaction" in
   * the list of allowed_updates to receive these updates.
   */
  message_reaction?: RawMessageReactionUpdated;
  /**
   * Reactions to a message with anonymous reactions were changed. The bot must
   * be an administrator in the chat and must explicitly specify
   * "message_reaction_count" in the list of allowed_updates to receive these
   * updates.
   */
  message_reaction_count?: RawMessageReactionCountUpdated;
  /** New incoming inline query */
  inline_query?: RawInlineQuery;
  /**
   * The result of an inline query that was chosen by a user and sent to their
   * chat partner. Please see our documentation on the feedback collecting for
   * details on how to enable these updates for your bot.
   */
  chosen_inline_result?: RawChosenInlineResult;
  /** New incoming callback query */
  callback_query?: RawCallbackQuery;
  /** New incoming shipping query. Only for invoices with flexible price */
  shipping_query?: RawShippingQuery;
  /** New incoming pre-checkout query. Contains full information about checkout */
  pre_checkout_query?: RawPreCheckoutQuery;
  /** A purchase was completed; contains information about the purchase */
  purchased_paid_media?: RawPaidMediaPurchased;
  /**
   * New poll state. Bots receive only updates about stopped polls and polls,
   * which are sent by the bot
   */
  poll?: RawPoll;
  /**
   * A user changed their answer in a non-anonymous poll. Bots receive new votes
   * only in polls that were sent by the bot itself.
   */
  poll_answer?: RawPollAnswer;
  /**
   * The bot's chat member status was updated in a chat. For private chats, this
   * update is received only when the bot is blocked or unblocked by the user.
   */
  my_chat_member?: RawChatMemberUpdated;
  /**
   * A chat member's status was updated in a chat. The bot must be an
   * administrator in the chat and must explicitly specify "chat_member" in the
   * list of allowed_updates to receive these updates.
   */
  chat_member?: RawChatMemberUpdated;
  /** A join request was sent to a chat; information about the request */
  chat_join_request?: RawChatJoinRequest;
  /** A boost was added to a chat or changed. */
  chat_boost?: RawChatBoostUpdated;
  /** A boost was removed from a chat */
  removed_chat_boost?: RawChatBoostRemoved;
};

export type UploadingFileSource = {
  data: string | Buffer | Readable;
  fileName?: string;
  contentType?: string;
  contentLength?: number;
};

export type UploadingFileInfo = {
  source: UploadingFileSource;
  fieldName: string;
  assetTag?: string;
};

export type TelegramSegmentValue = {
  method: string;
  params: Record<string, unknown>;
  toNonChatTarget?: boolean;
  files?: UploadingFileInfo[];
};

export type TelegramComponent<
  Props,
  Segment extends
    IntermediateSegment<TelegramSegmentValue> = UnitSegment<TelegramSegmentValue>,
> = NativeComponent<Props, Segment>;

export type TelegramJob = {
  agentId: number;
  method: string;
  params: Record<string, unknown>;
  key: undefined | string;
  files?: UploadingFileInfo[];
};

export type TelegramEventContext = {
  platform: 'telegram';
  event: TelegramEvent;
  metadata: WebhookMetadata;
  bot: TelegramBot;
  reply(node: SociablyNode): Promise<null | TelegramDispatchResponse>;
};

export type TelegramEventMiddleware = EventMiddleware<
  TelegramEventContext,
  null
>;

export type TelegramDispatchFrame = DispatchFrame<TelegramChat, TelegramJob>;

export type BotApiResult = Record<string, unknown>;

export type TelegramResult = {
  ok: true;
  description?: string;
  result: BotApiResult;
};

export type FailApiResult = {
  ok: false;
  description?: string;
  error_code: number;
  params?: {
    migrate_to_chat_id?: number;
    retry_after?: number;
  };
};

export type TelegramDispatchResponse = DispatchResponse<
  TelegramJob,
  TelegramResult
>;

export type TelegramDispatchMiddleware = DispatchMiddleware<
  TelegramJob,
  TelegramDispatchFrame,
  TelegramResult
>;

export type TelegramPlatformUtilities = PlatformUtilities<
  TelegramEventContext,
  null,
  TelegramJob,
  TelegramDispatchFrame,
  TelegramResult
>;

export type TelegramAgentSettings = {
  /** The access token of the bot. Like: `1234567890:AaBbCc_321-DdEeFf` */
  botToken: string;
  /** The username of the bot without the prefixing `@`. Like `MyBot` */
  botName: string;
};

export type TelegramConfigs = {
  agentSettings?: TelegramAgentSettings;
  multiAgentSettings?: TelegramAgentSettings[];
  agentSettingsService?: Interfaceable<AgentSettingsAccessorI>;
  /** The webhook path to receive events. Default to `.` */
  webhookPath?: string;
  /** The max API request connections at the same time */
  maxRequestConnections?: number;
  /** Secret token to be verified on `X-Telegram-Bot-Api-Secret-Token` header */
  secretToken: string;
  /**
   * Whether to verify `X-Telegram-Bot-Api-Secret-Token` header on webhook
   * request. Default to `true`
   */
  shouldVerifySecretToken?: boolean;
  eventMiddlewares?: TelegramEventMiddleware[];
  dispatchMiddlewares?: TelegramDispatchMiddleware[];
};

export type AgentSettingsAccessor = AgentSettingsAccessorI;

// Additional missing types
export type RawUserProfilePhotos = {
  /** Total number of profile pictures the target user has */
  total_count: number;
  /** Requested profile pictures (in up to 4 sizes each) */
  photos: RawPhotoSize[][];
};

export type RawChatPermissions = {
  /**
   * True, if the user is allowed to send text messages, contacts, giveaways,
   * giveaway winners, invoices, locations and venues
   */
  can_send_messages?: boolean;
  /** True, if the user is allowed to send audios */
  can_send_audios?: boolean;
  /** True, if the user is allowed to send documents */
  can_send_documents?: boolean;
  /** True, if the user is allowed to send photos */
  can_send_photos?: boolean;
  /** True, if the user is allowed to send videos */
  can_send_videos?: boolean;
  /** True, if the user is allowed to send video notes */
  can_send_video_notes?: boolean;
  /** True, if the user is allowed to send voice notes */
  can_send_voice_notes?: boolean;
  /** True, if the user is allowed to send polls and checklists */
  can_send_polls?: boolean;
  /**
   * True, if the user is allowed to send animations, games, stickers and use
   * inline bots
   */
  can_send_other_messages?: boolean;
  /** True, if the user is allowed to add web page previews to their messages */
  can_add_web_page_previews?: boolean;
  /**
   * True, if the user is allowed to change the chat title, photo and other
   * settings
   */
  can_change_info?: boolean;
  /** True, if the user is allowed to invite new users to the chat */
  can_invite_users?: boolean;
  /** True, if the user is allowed to pin messages */
  can_pin_messages?: boolean;
  /** True, if the user is allowed to create forum topics */
  can_manage_topics?: boolean;
};

export type RawChatPhoto = {
  /** File identifier of small (160x160) chat photo */
  small_file_id: string;
  /** Unique file identifier of small (160x160) chat photo */
  small_file_unique_id: string;
  /** File identifier of big (640x640) chat photo */
  big_file_id: string;
  /** Unique file identifier of big (640x640) chat photo */
  big_file_unique_id: string;
};

export type RawChatLocation = {
  /** The location to which the supergroup is connected */
  location: RawLocation;
  /** Location address; 1-64 characters */
  address: string;
};

export type RawForumTopic = {
  /** Unique identifier of the forum topic */
  message_thread_id: number;
  /** Name of the topic */
  name: string;
  /** Color of the topic icon in RGB format */
  icon_color: number;
  /** Unique identifier of the custom emoji shown as the topic icon */
  icon_custom_emoji_id?: string;
};

export type RawBotCommand = {
  /** Text of the command; 1-32 characters */
  command: string;
  /** Description of the command; 1-256 characters */
  description: string;
};

export type RawMenuButton =
  | RawMenuButtonCommands
  | RawMenuButtonWebApp
  | RawMenuButtonDefault;

export type RawMenuButtonCommands = {
  /** Type of the button, always "commands" */
  type: 'commands';
};

export type RawMenuButtonWebApp = {
  /** Type of the button, always "web_app" */
  type: 'web_app';
  /** Text on the button */
  text: string;
  /** Description of the Web App that will be launched */
  web_app: RawWebAppInfo;
};

export type RawMenuButtonDefault = {
  /** Type of the button, always "default" */
  type: 'default';
};

export type RawResponseParameters = {
  /** The group has been migrated to a supergroup with the specified identifier */
  migrate_to_chat_id?: number;
  /** In case of exceeding flood control, the number of seconds left to wait */
  retry_after?: number;
};

export type RawInputFile = {
  file: string | Buffer; // Can be string (file_id or URL) or file data
};

// Business-related types
export type RawBusinessConnection = {
  /** Unique identifier of the business connection */
  id: string;
  /** Business account user that created the business connection */
  user: RawUser;
  /**
   * Identifier of a private chat with the user who created the business
   * connection
   */
  user_chat_id: number;
  /** Date the connection was established in Unix time */
  date: number;
  /** True, if the connection is active */
  is_enabled: boolean;
};

export type RawBusinessMessagesDeleted = {
  /** Unique identifier of the business connection */
  business_connection_id: string;
  /**
   * Information about a chat in the business account. The bot may not have
   * access to the chat or the corresponding user.
   */
  chat: RawChat;
  /** The list of identifiers of deleted messages in the chat */
  message_ids: number[];
};

export type RawPaidMediaPurchased = {
  /** User who purchased the media */
  from: RawUser;
  /** Bot-specified paid media payload */
  paid_media_payload: string;
};

// Message reaction types
export type RawMessageReactionUpdated = {
  /** The chat containing the message the user reacted to */
  chat: RawChat;
  /** Unique identifier of the message inside the chat */
  message_id: number;
  /** The user that changed the reaction, if the user isn't anonymous */
  user?: RawUser;
  /**
   * The chat on behalf of which the reaction was changed, if the user is
   * anonymous
   */
  actor_chat?: RawChat;
  /** Date of the change in Unix time */
  date: number;
  /** Previous list of reaction types that were set by the user */
  old_reaction: RawReactionType[];
  /** New list of reaction types that have been set by the user */
  new_reaction: RawReactionType[];
};

export type RawMessageReactionCountUpdated = {
  /** The chat containing the message */
  chat: RawChat;
  /** Unique message identifier inside the chat */
  message_id: number;
  /** Date of the change in Unix time */
  date: number;
  /** List of reactions that are present on the message */
  reactions: RawReactionCount[];
};

export type RawReactionType =
  | RawReactionTypeEmoji
  | RawReactionTypeCustomEmoji
  | RawReactionTypePaid;

export type RawReactionTypeEmoji = {
  /** Type of the reaction, always "emoji" */
  type: 'emoji';
  /** Reaction emoji */
  emoji: string;
};

export type RawReactionTypeCustomEmoji = {
  /** Type of the reaction, always "custom_emoji" */
  type: 'custom_emoji';
  /** Custom emoji identifier */
  custom_emoji_id: string;
};

export type RawReactionTypePaid = {
  /** Type of the reaction, always "paid" */
  type: 'paid';
};

export type RawReactionCount = {
  /** Type of the reaction */
  type: RawReactionType;
  /** Number of times the reaction was added */
  total_count: number;
};

// Chat boost types
export type RawChatBoostUpdated = {
  /** Chat which was boosted */
  chat: RawChat;
  /** Information about the chat boost */
  boost: RawChatBoost;
};

export type RawChatBoostRemoved = {
  /** Chat which was boosted */
  chat: RawChat;
  /** Unique identifier of the boost */
  boost_id: string;
  /** Point in time when the boost was removed */
  remove_date: number;
  /** Source of the removed boost */
  source: RawChatBoostSource;
};

export type RawChatBoost = {
  /** Unique identifier of the boost */
  boost_id: string;
  /** Point in time when the chat was boosted */
  add_date: number;
  /** Point in time when the boost will automatically expire */
  expiration_date: number;
  /** Source of the added boost */
  source: RawChatBoostSource;
};

export type RawChatBoostSource =
  | RawChatBoostSourcePremium
  | RawChatBoostSourceGiftCode
  | RawChatBoostSourceGiveaway;

export type RawChatBoostSourcePremium = {
  /** Source of the boost, always "premium" */
  source: 'premium';
  /** User that boosted the chat */
  user: RawUser;
};

export type RawChatBoostSourceGiftCode = {
  /** Source of the boost, always "gift_code" */
  source: 'gift_code';
  /** User for which the gift code was created */
  user: RawUser;
};

export type RawChatBoostSourceGiveaway = {
  /** Source of the boost, always "giveaway" */
  source: 'giveaway';
  /** Identifier of a message in the chat with the giveaway */
  giveaway_message_id: number;
  /** User that won the prize in the giveaway if any */
  user?: RawUser;
  /** Number of Telegram Stars to be split between giveaway winners */
  prize_star_count?: number;
  /** True, if the giveaway was completed, but there was no user to win the prize */
  is_unclaimed?: boolean;
};

// Chat join request
export type RawChatJoinRequest = {
  /** Chat to which the request was sent */
  chat: RawChat;
  /** User that sent the join request */
  from: RawUser;
  /**
   * Identifier of a private chat with the user who sent the join request. This
   * number may have more than 32 significant bits.
   */
  user_chat_id: number;
  /** Date the request was sent in Unix time */
  date: number;
  /** Bio of the user */
  bio?: string;
  /** Chat invite link that was used by the user to send the join request */
  invite_link?: RawChatInviteLink;
};

// Background types
export type RawBackgroundFill =
  | RawBackgroundFillSolid
  | RawBackgroundFillGradient
  | RawBackgroundFillFreeformGradient;

export type RawBackgroundFillSolid = {
  /** Type of the background fill, always "solid" */
  type: 'solid';
  /** The color of the background fill in the RGB24 format */
  color: number;
};

export type RawBackgroundFillGradient = {
  /** Type of the background fill, always "gradient" */
  type: 'gradient';
  /** Top color of the gradient in the RGB24 format */
  top_color: number;
  /** Bottom color of the gradient in the RGB24 format */
  bottom_color: number;
  /** Clockwise rotation angle of the background fill in degrees; 0-359 */
  rotation_angle: number;
};

export type RawBackgroundFillFreeformGradient = {
  /** Type of the background fill, always "freeform_gradient" */
  type: 'freeform_gradient';
  /**
   * A list of the 3 or 4 base colors that are used to generate the freeform
   * gradient
   */
  colors: number[];
};

export type RawBackgroundType =
  | RawBackgroundTypeFill
  | RawBackgroundTypeWallpaper
  | RawBackgroundTypePattern
  | RawBackgroundTypeChatTheme;

export type RawBackgroundTypeFill = {
  /** Type of the background, always "fill" */
  type: 'fill';
  /** The background fill */
  fill: RawBackgroundFill;
  /** Dimming of the background in dark themes, as a percentage; 0-100 */
  dark_theme_dimming: number;
};

export type RawBackgroundTypeWallpaper = {
  /** Type of the background, always "wallpaper" */
  type: 'wallpaper';
  /** Document with the wallpaper */
  document: RawDocument;
  /** Dimming of the background in dark themes, as a percentage; 0-100 */
  dark_theme_dimming: number;
  /** True, if the wallpaper is downscaled to fit in a 450x450 square */
  is_blurred?: boolean;
  /** True, if the background moves slightly when the device is tilted */
  is_moving?: boolean;
};

export type RawBackgroundTypePattern = {
  /** Type of the background, always "pattern" */
  type: 'pattern';
  /** Document with the pattern */
  document: RawDocument;
  /** The background fill that is combined with the pattern */
  fill: RawBackgroundFill;
  /**
   * Intensity of the pattern when it is shown above the filled background;
   * 0-100
   */
  intensity: number;
  /** True, if the background fill must be applied only to the pattern itself */
  is_inverted?: boolean;
  /** True, if the background moves slightly when the device is tilted */
  is_moving?: boolean;
};

export type RawBackgroundTypeChatTheme = {
  /** Type of the background, always "chat_theme" */
  type: 'chat_theme';
  /** Name of the chat theme, which is usually an emoji */
  theme_name: string;
};

// Additional suggested post types
export type RawSuggestedPostParameters = {
  /** Proposed price of the post */
  price?: RawSuggestedPostPrice;
  /** Proposed send date of the post */
  send_date?: number;
};
