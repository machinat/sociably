import { TELEGRAM } from '../constant';
import { TelegramChat, TelegramChatInstance } from '../channel';
import TelegramUser from '../user';
import type {
  RawChat,
  RawUser,
  RawMessage,
  RawFile,
  RawPhotoSize,
  RawAnimation,
  RawAudio,
  RawVideo,
  RawVideoNote,
  RawVoice,
  RawDocument,
  RawSticker,
  RawContact,
  RawGame,
  RawDice,
  RawPoll,
  RawPollOption,
  RawLocation,
  RawVenue,
  RawMessageEntity,
  RawMaskPosition,
  RawPassportData,
  RawInlineQuery,
  RawInlineKeyboardMarkup,
  RawChosenInlineResult,
  RawSuccessfulPayment,
  RawCallbackQuery,
  RawShippingQuery,
  RawShippingAddress,
  RawPreCheckoutQuery,
  RawOrderInfo,
  RawPollAnswer,
} from '../types';

export interface EventBase {
  platform: typeof TELEGRAM;
  /** The update's unique identifier. Update identifiers start from a certain positive number and increase sequentially. This ID becomes especially handy if you're using Webhooks, since it allows you to ignore repeated updates or to restore the correct update sequence, should they get out of order. If there are no new updates for at least a week, then identifier of the next update will be chosen randomly instead of sequentially. */
  updateId: string;
}

export const EventBase: EventBase = {
  platform: TELEGRAM,
  get updateId() {
    return this.payload.update_id;
  },
};

export interface Message {
  message: RawMessage;
}

export const Message: Message = {
  get message() {
    return this.payload.message;
  },
};

export const EditedMessage: Message = {
  get message() {
    return this.payload.edited_message;
  },
};

export const ChannelPost: Message = {
  get message() {
    return this.payload.channel_post;
  },
};

export const EditedChannelPost: Message = {
  get message() {
    return this.payload.edited_channel_post;
  },
};

export interface MessageDetail {
  channel: TelegramChat;
  user: null | TelegramUser;
  /**	Unique message identifier inside this chat */
  messageId: number;
  /** Raw user object represent the sender, empty for messages sent to channels */
  from?: RawUser;
  /** Date the message was sent in Unix time */
  date?: number;
  /** Conversation the message belongs to */
  chat: RawChat;
  /** For forwarded messages, sender of the original message */
  forwardFrom?: RawUser;
  /** For messages forwarded from channels, information about the original channel */
  forwardFromChat?: RawChat;
  /** For messages forwarded from channels, identifier of the original message in the channel */
  forwardFromMessageId?: number;
  /** For messages forwarded from channels, signature of the post author if present */
  forwardSignature?: string;
  /** Sender's name for messages forwarded from users who disallow adding a link to their account in forwarded messages */
  forwardSenderName?: string;
  /** For forwarded messages, date the original message was sent in Unix time */
  forwardDate?: number;
  /** For replies, the original message. Note that the Message object in this field will not contain furth */
  replyToMessage?: RawMessage;
  /** Bot through which the message was sent */
  viaBot?: RawUser;
  /** Date the message was last edited in Unix time */
  editDate?: number;
  /** The unique identifier of a media message group this message belongs to */
  mediaGroupId?: string;
  /** Signature of the post author for messages in channels */
  authorSignature?: string;
  /** The domain name of the website on which the user has logged in. */
  connectedWebsite?: string;
  /** Telegram Passport data */
  passportData?: RawPassportData;
  /** Inline keyboard attached to the message. login_url buttons are represented as ordinary url buttons. */
  replyMarkup?: RawInlineKeyboardMarkup;
}

export const MessageDetail: MessageDetail = {
  get channel() {
    return new TelegramChat(this.botId, this.message.chat);
  },
  get user() {
    const fromUser = this.message.from;
    return fromUser ? new TelegramUser(fromUser.id, fromUser) : null;
  },
  get messageId(): number {
    return this.message.message_id;
  },
  get from(): undefined | RawUser {
    return this.message.from;
  },
  get date(): undefined | number {
    return this.message.date;
  },
  get chat(): RawChat {
    return this.message.chat;
  },
  get forwardFrom(): undefined | RawUser {
    return this.message.forward_from;
  },
  get forwardFromChat(): undefined | RawChat {
    return this.message.forward_from_chat;
  },
  get forwardFromMessageId(): undefined | number {
    return this.message.forward_from_message_id;
  },
  get forwardSignature(): undefined | string {
    return this.message.forward_signature;
  },
  get forwardSenderName(): undefined | string {
    return this.message.forward_sender_name;
  },
  get forwardDate(): undefined | number {
    return this.message.forward_date;
  },
  get replyToMessage(): undefined | RawMessage {
    return this.message.reply_to_message;
  },
  get viaBot(): undefined | RawUser {
    return this.message.via_bot;
  },
  get editDate(): undefined | number {
    return this.message.edit_date;
  },
  get mediaGroupId(): undefined | string {
    return this.message.media_group_id;
  },
  get authorSignature(): undefined | string {
    return this.message.author_signature;
  },
  get connectedWebsite(): undefined | string {
    return this.message.connected_website;
  },
  get passportData(): undefined | RawPassportData {
    return this.message.passport_data;
  },
  get replyMarkup(): undefined | RawInlineKeyboardMarkup {
    return this.message.reply_markup;
  },
};

export interface Text {
  /** The actual UTF-8 text of the message, 0-4096 characters */
  text: string;
  /** For text messages, special entities like usernames, URLs, bot commands, etc. that appear in the text */
  entities?: RawMessageEntity[];
}

export const Text: Text = {
  get text() {
    return this.message.text;
  },
  get entities() {
    return this.message.entities;
  },
};

export interface File {
  file: RawFile;
}

export interface FileDetail {
  /** Identifier for this file, which can be used to download or reuse the file */
  fileId: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  fileUniqueId: string;
  /** MIME type of the file as defined by sender */
  mimeType?: string;
  /** File size */
  fileSize?: number;
  /** File thumbnail as defined by sender if available */
  thumb?: RawPhotoSize;
  /** Original filename as defined by sender if available */
  fileName?: string;
}

export const FileDetail: FileDetail = {
  get fileId() {
    return this.file.file_id;
  },
  get fileUniqueId() {
    return this.file.file_unique_id;
  },
  get mimeType() {
    return this.file.mime_type;
  },
  get fileSize() {
    return this.file.file_size;
  },
  get thumb() {
    return this.file.thumb;
  },
  get fileName() {
    return this.file.file_name;
  },
};

export interface Animation extends File {
  /** Animation object. */
  animation: RawAnimation;
  /**	Video width as defined by sender */
  width: number;
  /**	Video height as defined by sender */
  height: number;
  /**	Duration of the video in seconds as defined by sender */
  duration: number;
}

export const Animation: Animation = {
  get animation() {
    return this.message.animation;
  },
  get file() {
    return this.message.animation;
  },
  get width() {
    return this.message.animation.width;
  },
  get height() {
    return this.message.animation.height;
  },
  get duration() {
    return this.message.animation.duration;
  },
};

export interface Audio extends File {
  /** Audio object. */
  audio: RawAudio;
  /** Duration of the audio in seconds as defined by sender */
  duration: number;
  /** Performer of the audio as defined by sender or by audio tags */
  performer?: string;
  /** Title of the audio as defined by sender or by audio tags */
  title?: string;
}

export const Audio: Audio = {
  get audio() {
    return this.message.audio;
  },
  get file() {
    return this.message.audio;
  },
  get duration() {
    return this.message.audio.duration;
  },
  get performer() {
    return this.message.audio.performer;
  },
  get title() {
    return this.message.audio.title;
  },
};

export interface Document extends File {
  /** Document object */
  document: RawDocument;
}

export const Document: Document = {
  get document() {
    return this.message.document;
  },
  get file() {
    return this.message.document;
  },
};

export interface Photo {
  /** Available sizes of the photo */
  photo: RawPhotoSize[];
}

export const Photo: Photo = {
  get photo() {
    return this.message.photo;
  },
};

export interface Sticker extends File {
  /** Sticker object. */
  sticker: RawSticker;
  /** Sticker width */
  width: number;
  /** Sticker height */
  height: number;
  /** True if the sticker is animated */
  isAnimated?: boolean;
  /** Emoji associated with the sticker */
  emoji?: string;
  /** Name of the sticker set to which the sticker belongs */
  setName?: string;
  /** For mask stickers, the position where the mask should be placed */
  maskPosition?: RawMaskPosition;
}

export const Sticker: Sticker = {
  get sticker() {
    return this.message.sticker;
  },
  get file() {
    return this.message.sticker;
  },
  get width() {
    return this.message.sticker.width;
  },
  get height() {
    return this.message.sticker.height;
  },
  get isAnimated() {
    return this.message.sticker.isAnimated;
  },
  get emoji() {
    return this.message.sticker.emoji;
  },
  get setName() {
    return this.message.sticker.setName;
  },
  get maskPosition() {
    return this.message.sticker.maskPosition;
  },
};

export interface Video extends File {
  /** Video object. */
  video: RawVideo;
  /** Video width as defined by sender */
  width: number;
  /** Video height as defined by sender */
  height: number;
  /** Duration of the video in seconds as defined by sender */
  duration: number;
}

export const Video: Video = {
  get video() {
    return this.message.video;
  },
  get file() {
    return this.message.video;
  },
  get width() {
    return this.message.video.width;
  },
  get height() {
    return this.message.video.height;
  },
  get duration() {
    return this.message.video.duration;
  },
};

export interface VideoNote extends File {
  /** Video note object. */
  videoNote: RawVideoNote;
  /** Video width and height (diameter of the video message) as defined by sender */
  length: number;
  /** Duration of the video in seconds as defined by sender */
  duration: number;
}

export const VideoNote: VideoNote = {
  get videoNote() {
    return this.message.video_note;
  },
  get file() {
    return this.message.video_note;
  },
  get length() {
    return this.message.video_note.length;
  },
  get duration() {
    return this.message.video_note.duration;
  },
};

export interface Voice extends File {
  /** Voice object. */
  voice: RawVoice;
  /** Duration of the audio in seconds as defined by sender */
  duration: number;
}

export const Voice: Voice = {
  get voice() {
    return this.message.voice;
  },
  get file() {
    return this.message.voice;
  },
  get duration() {
    return this.message.voice.duration;
  },
};

export interface Caption {
  /** Caption for the animation, audio, document, photo, video or voice, 0-1024 characters */
  caption?: string;
  /** For messages with a caption, special entities like usernames, URLs, bot commands, etc. that appear in the caption */
  cationEntities?: RawMessageEntity[];
}

export const Caption: Caption = {
  get caption() {
    return this.message.caption;
  },
  get cationEntities() {
    return this.message.caption_entities;
  },
};

export interface Contact {
  /** Contact object. */
  contact: RawContact;
  /** Contact's phone number */
  phoneNumber: string;
  /** Contact's first name */
  firstName: string;
  /** Contact's last name */
  lastName?: string;
  /** Contact's user identifier in Telegram */
  userId?: number;
  /** Additional data about the contact in the form of a vCard */
  vcard?: string;
}

export const Contact: Contact = {
  get contact() {
    return this.message.contact;
  },
  get phoneNumber() {
    return this.message.contact.phone_number;
  },
  get firstName() {
    return this.message.contact.first_name;
  },
  get lastName() {
    return this.message.contact.last_name;
  },
  get userId() {
    return this.message.contact.user_id;
  },
  get vcard() {
    return this.message.contact.vcard;
  },
};

export interface Dice {
  /** Dice object. */
  dice: RawDice;
  /** Emoji on which the dice throw animation is based */
  emoji: string;
  /** Value of the dice, 1-6 for “🎲” and “🎯” base emoji, 1-5 for “🏀” base emoji */
  value: number;
}

export const Dice: Dice = {
  get dice() {
    return this.message.dice;
  },
  get emoji() {
    return this.message.dice.emoji;
  },
  get value() {
    return this.message.dice.value;
  },
};

export interface Game {
  /** Game object. */
  game: RawGame;
  /** Title of the game */
  title: string;
  /** Description of the game */
  description: string;
  /** Photo that will be displayed in the game message in chats. */
  photo: RawPhotoSize[];
  /** Brief description of the game or high scores included in the game message. Can be automatically edited to include current high scores for the game when the bot calls setGameScore, or manually edited using editMessageText. 0-4096 characters. */
  text?: string;
  /** Special entities that appear in text, such as usernames, URLs, bot commands, etc. */
  textEntities?: RawMessageEntity[];
  /** Animation that will be displayed in the game message in chats. Upload via BotFather */
  animation?: Animation;
}

export const Game: Game = {
  get game() {
    return this.message.game;
  },
  get title() {
    return this.message.game.title;
  },
  get description() {
    return this.message.game.description;
  },
  get photo() {
    return this.message.game.photo;
  },
  get text() {
    return this.message.game.text;
  },
  get textEntities() {
    return this.message.game.text_entities;
  },
  get animation() {
    return this.message.game.animation;
  },
};

export interface MessagePoll {
  /** Poll object. */
  poll: RawPoll;
}

export const MessagePoll: MessagePoll = {
  get poll() {
    return this.message.poll;
  },
};

export interface PollDetail {
  /** Unique poll identifier */
  pollId: string;
  /** Poll question, 1-255 characters */
  question: string;
  /** List of poll options */
  options: RawPollOption[];
  /** Total number of users that voted in the poll */
  totalVoterCount: number;
  /** True, if the poll is closed */
  isClosed: boolean;
  /** True, if the poll is anonymous */
  isAnonymous: boolean;
  /** Poll type, currently can be “regular” or “quiz” */
  pollType: string;
  /** True, if the poll allows multiple answers */
  allowsMultipleAnswers: boolean;
  /** 0-based identifier of the correct answer option. Available only for polls in the quiz mode, which are closed, or was sent (not forwarded) by the bot or to the private chat with the bot. */
  correctOptionId?: number;
  /** Text that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters */
  explanation?: string;
  /** Special entities like usernames, URLs, bot commands, etc. that appear in the explanation */
  explanationEntities?: RawMessageEntity[];
  /** Amount of time in seconds the poll will be active after creation */
  openPeriod?: number;
  /** Point in time (Unix timestamp) when the poll will be automatically closed */
  closeDate?: number;
}

export const PollDetail: PollDetail = {
  get pollId() {
    return this.message.poll.id;
  },
  get question() {
    return this.message.poll.question;
  },
  get options() {
    return this.message.poll.options;
  },
  get totalVoterCount() {
    return this.message.poll.total_voter_count;
  },
  get isClosed() {
    return this.message.poll.is_closed;
  },
  get isAnonymous() {
    return this.message.poll.is_anonymous;
  },
  get pollType() {
    return this.message.poll.type;
  },
  get allowsMultipleAnswers() {
    return this.message.poll.allows_multiple_answers;
  },
  get correctOptionId() {
    return this.message.poll.correct_option_id;
  },
  get explanation() {
    return this.message.poll.explanation;
  },
  get explanationEntities() {
    return this.message.poll.explanation_entities;
  },
  get openPeriod() {
    return this.message.poll.open_period;
  },
  get closeDate() {
    return this.message.poll.close_date;
  },
};

export interface Venue {
  /** Venue object. */
  venue: RawVenue;
  /** Venue location */
  location: Location;
  /** Name of the venue */
  title: string;
  /** Address of the venue */
  address: string;
  /** Foursquare identifier of the venue */
  foursquareId?: string;
  /** Foursquare type of the venue. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
  foursquareType?: string;
}

export const Venue: Venue = {
  get venue() {
    return this.message.venue;
  },
  get location() {
    return this.message.venue.location;
  },
  get title() {
    return this.message.venue.title;
  },
  get address() {
    return this.message.venue.address;
  },
  get foursquareId() {
    return this.message.venue.foursquare_id;
  },
  get foursquareType() {
    return this.message.venue.foursquare_type;
  },
};

export interface Location {
  /** Location object. */
  location: RawLocation;
  /** Longitude as defined by sender */
  longitude: number;
  /** Latitude as defined by sender */
  latitude: number;
}

export const Location: Location = {
  get location() {
    return this.message.location;
  },
  get longitude() {
    return this.message.location.longitude;
  },
  get latitude() {
    return this.message.location.latitude;
  },
};

export interface NewChatMembers {
  /** New members that were added to the group or supergroup and information about them (the bot itself may be one of these members) */
  newChatMembers: RawUser[];
}

export const NewChatMembers: NewChatMembers = {
  get newChatMembers() {
    return this.message.new_chat_members;
  },
};

export interface LeftChatMember {
  /** A member was removed from the group, information about them (this member may be the bot itself) */
  leftChatMember: RawUser;
}

export const LeftChatMember: LeftChatMember = {
  get leftChatMember() {
    return this.message.left_chat_member;
  },
};

export interface NewChatTitle {
  /** A chat title was changed to this value */
  newChatTitle: string;
}

export const NewChatTitle: NewChatTitle = {
  get newChatTitle() {
    return this.message.new_chat_title;
  },
};

export interface NewChatPhoto {
  /** A chat photo was changed to this value. */
  newChatPhoto: RawPhotoSize[];
}

export const NewChatPhoto: NewChatPhoto = {
  get newChatPhoto() {
    return this.message.new_chat_photo;
  },
};

export interface MigrateToChatId {
  /** This number may be greater than 32 bits and some programming languages may have difficulty/silent defects in interpreting it. But it is smaller than 52 bits, so a signed 64 bit integer or double-precision float type are safe for storing this identifier. */
  migrateToChatId: number;
}

export const MigrateToChatId: MigrateToChatId = {
  get migrateToChatId() {
    return this.message.migrate_to_chat_id;
  },
};

export interface MigrateFromChatId {
  /** This number may be greater than 32 bits and some programming languages may have difficulty/silent defects in interpreting it. But it is smaller than 52 bits, so a signed 64 bit integer or double-precision float type are safe for storing this identifier. */
  migrateFromChatId: number;
}

export const MigrateFromChatId: MigrateFromChatId = {
  get migrateFromChatId() {
    return this.message.migrate_from_chat_id;
  },
};

export interface PinnedMessage {
  /** Pinned message object. Note that the Message object in this field will not contain further reply_to_message fields even if it is itself a reply. */
  pinnedMessage: RawMessage;
}

export const PinnedMessage: PinnedMessage = {
  get pinnedMessage() {
    return this.message.pinned_message;
  },
};

export interface SuccessfulPayment {
  /** Successful payment information object. */
  successfulPayment: RawSuccessfulPayment;
  /** Three-letter ISO 4217 currency code */
  currency: string;
  /** Total price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  totalAmount: number;
  /** Bot specified invoice payload */
  invoicePayload: string;
  /** Identifier of the shipping option chosen by the user */
  shippingOptionId?: string;
  /** Order info provided by the user */
  orderInfo?: RawOrderInfo;
  /** Telegram payment identifier */
  telegramPpaymentChargeId: string;
  /** Provider payment identifier */
  providerPaymentChargeId: string;
}

export const SuccessfulPayment: SuccessfulPayment = {
  get successfulPayment() {
    return this.message.successful_payment;
  },
  get currency() {
    return this.message.successful_payment.currency;
  },
  get totalAmount() {
    return this.message.successful_payment.total_amount;
  },
  get invoicePayload() {
    return this.message.successful_payment.invoice_payload;
  },
  get shippingOptionId() {
    return this.message.successful_payment.shipping_option_id;
  },
  get orderInfo() {
    return this.message.successful_payment.order_info;
  },
  get telegramPpaymentChargeId() {
    return this.message.successful_payment.telegram_payment_charge_id;
  },
  get providerPaymentChargeId() {
    return this.message.successful_payment.provider_payment_charge_id;
  },
};

export interface InlineQuery {
  channel: null;
  user: TelegramUser;
  /** Inline query object. */
  inlineQuery: RawInlineQuery;
  /**	Unique identifier for this query */
  queryId: string;
  /** Sender */
  fromUser: RawUser;
  /** Sender location, only for bots that request user location */
  location?: RawLocation;
  /** Text of the query (up to 256 characters) */
  query: string;
  /**	Offset of the results to be returned, can be controlled by the bot */
  offset?: string;
}

export const InlineQuery: InlineQuery = {
  channel: null,
  get user() {
    return this.payload.inline_query.from;
  },
  get inlineQuery() {
    return this.payload.inline_query;
  },
  get queryId() {
    return this.payload.inline_query.id;
  },
  get fromUser() {
    return this.payload.inline_query.from;
  },
  get location() {
    return this.payload.inline_query.location;
  },
  get query() {
    return this.payload.inline_query.query;
  },
  get offset() {
    return this.payload.inline_query.offset;
  },
};

export interface ChosenInlineResult {
  channel: null;
  user: TelegramUser;
  /** Inline result object. */
  chosenInlineResult: RawChosenInlineResult;
  /**	The unique identifier for the result that was chosen */
  resultId: string;
  /**	The user that chose the result */
  fromUser: RawUser;
  /** Sender location, only for bots that require user location */
  location?: RawLocation;
  /** Identifier of the sent inline message. Available only if there is an inline keyboard attached to the message. Will be also received in callback queries and can be used to edit the message. */
  inlineMessageId?: string;
  /**	The query that was used to obtain the result */
  query: string;
}

export const ChosenInlineResult: ChosenInlineResult = {
  channel: null,
  get user() {
    return this.payload.chosen_inline_result.from;
  },
  get chosenInlineResult() {
    return this.payload.chosen_inline_result;
  },
  get resultId() {
    return this.payload.chosen_inline_result.result_id;
  },
  get fromUser() {
    return this.payload.chosen_inline_result.from;
  },
  get location() {
    return this.payload.chosen_inline_result.location;
  },
  get inlineMessageId() {
    return this.payload.chosen_inline_result.inline_message_id;
  },
  get query() {
    return this.payload.chosen_inline_result.query;
  },
};

export interface CallbackQuery {
  channel: null | TelegramChat;
  user: TelegramUser;
  /** Callback query object. */
  callbackQuery: RawCallbackQuery;
  /** Unique identifier for this query */
  queryId: string;
  /** Sender */
  fromUser: RawUser;
  /** Message with the callback button that originated the query. Note that message content and message date will not be available if the message is too old */
  message?: RawMessage;
  /** Identifier of the message sent via the bot in inline mode, that originated the query. */
  inlineMessageId?: string;
  /** Global identifier, uniquely corresponding to the chat to which the message with the callback button was sent. Useful for high scores in games. */
  chatInstance: string;
  /** TelegramChatInstance object represent the channel of unique chatInstance id */
  chatInstanceChannel: TelegramChatInstance;
  /** Data associated with the callback button. Be aware that a bad client can send arbitrary data in this field. */
  data?: string;
  /** Short name of a Game to be returned, serves as the unique identifier for the game */
  gameShortName?: string;
}

export const CallbackQuery: CallbackQuery = {
  get channel() {
    const { message } = this.payload.callback_query;
    return message ? new TelegramChat(this.botId, message.chat) : null;
  },
  get user() {
    return this.payload.callback_query.from;
  },
  get callbackQuery() {
    return this.payload.callback_query;
  },
  get queryId() {
    return this.payload.callback_query.id;
  },
  get fromUser() {
    return this.payload.callback_query.from;
  },
  get message() {
    return this.payload.callback_query.message;
  },
  get inlineMessageId() {
    return this.payload.callback_query.inline_message_id;
  },
  get chatInstance() {
    return this.payload.callback_query.chat_instance;
  },
  get chatInstanceChannel() {
    return new TelegramChatInstance(
      this.botId,
      this.payload.callback_query.chat_instance
    );
  },
  get data() {
    return this.payload.callback_query.data;
  },
  get gameShortName() {
    return this.payload.callback_query.game_short_name;
  },
};

export interface ShippingQuery {
  channel: TelegramChat;
  user: TelegramUser;
  /** Shipping query object. */
  shippingQuery: RawShippingQuery;
  /** Unique query identifier */
  queryId: string;
  /** User who sent the query */
  fromUser: RawUser;
  /** Bot specified invoice payload */
  invoicePayload: string;
  /** User specified shipping address */
  shippingAddress: RawShippingAddress;
}

export const ShippingQuery: ShippingQuery = {
  get channel() {
    return TelegramChat.fromUser(this.botId, this.user);
  },
  get user() {
    return new TelegramUser(this.payload.shipping_query.from);
  },
  get shippingQuery() {
    return this.payload.shipping_query;
  },
  get queryId() {
    return this.payload.shipping_query.id;
  },
  get fromUser() {
    return this.payload.shipping_query.from;
  },
  get invoicePayload() {
    return this.payload.shipping_query.invoice_payload;
  },
  get shippingAddress() {
    return this.payload.shipping_query.shipping_address;
  },
};

export interface PreCheckoutQuery {
  channel: TelegramChat;
  user: TelegramUser;
  /** Pre-checkout query object. */
  preCheckoutQuery: RawPreCheckoutQuery;
  /** Unique query identifier */
  queryId: string;
  /** User who sent the query */
  fromUser: RawUser;
  /** Three-letter ISO 4217 currency code */
  currency: string;
  /** Total price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  totalAmount: number;
  /** Bot specified invoice payload */
  invoicePayload?: string;
  /**  Identifier of the shipping option chosen by the user */
  shippingOptionId?: string;
  /**  Order info provided by the user */
  orderInfo?: RawOrderInfo;
}

export const PreCheckoutQuery: PreCheckoutQuery = {
  get channel() {
    return TelegramChat.fromUser(this.botId, this.user);
  },
  get user() {
    return new TelegramUser(this.payload.pre_checkout_query.from);
  },
  get preCheckoutQuery() {
    return this.payload.pre_checkout_query;
  },
  get queryId() {
    return this.payload.pre_checkout_query.id;
  },
  get fromUser() {
    return this.payload.pre_checkout_query.from;
  },
  get currency() {
    return this.payload.pre_checkout_query.currency;
  },
  get totalAmount() {
    return this.payload.pre_checkout_query.total_amount;
  },
  get invoicePayload() {
    return this.payload.pre_checkout_query.invoice_payload;
  },
  get shippingOptionId() {
    return this.payload.pre_checkout_query.shipping_option_id;
  },
  get orderInfo() {
    return this.payload.pre_checkout_query.order_info;
  },
};

export interface PollChange {
  channel: null;
  user: null;
  /** Poll object. */
  poll: RawPoll;
}

export const PollChange: PollChange = {
  user: null,
  channel: null,
  get poll() {
    return this.payload.poll;
  },
};

export interface PollAnswer {
  channel: null;
  user: TelegramUser;
  /** Poll answer object. */
  pollAnswer: RawPollAnswer;
  /** Unique poll identifier */
  pollId: string;
  /** The user, who changed the answer to the poll */
  fromUser: RawUser;
  /**	0-based identifiers of answer options, chosen by the user. May be empty if the user retracted their vote. */
  optionIds: number[];
}

export const PollAnswer: PollAnswer = {
  channel: null,
  get user() {
    return new TelegramUser(this.payload.poll_answer.from);
  },
  get pollAnswer() {
    return this.payload.poll_answer;
  },
  get pollId() {
    return this.payload.poll_answer.poll_id;
  },
  get fromUser() {
    return this.payload.poll_answer.user;
  },
  get optionIds() {
    return this.payload.poll_answer.option_ids;
  },
};
