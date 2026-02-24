/* eslint-disable @typescript-eslint/no-empty-interface, @typescript-eslint/no-unsafe-declaration-merging */
import mixin from '@sociably/core/utils/mixin.js';
import { TELEGRAM } from '../constant.js';
import TelegramChat from '../Chat.js';
import TelegramUser from '../User.js';
import TelegramChatSender from '../ChatSender.js';
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
  RawChatMemberUpdated,
  TelegramRawEvent,
} from '../types.js';

class EventBase {
  platform = TELEGRAM;

  constructor(
    public botId: number,
    public payload: TelegramRawEvent,
  ) {}

  get agent() {
    return new TelegramUser(this.botId, true);
  }

  /**
   * The update's unique identifier. Update identifiers start from a certain
   * positive number and increase sequentially. This ID becomes especially handy
   * if you're using Webhooks, since it allows you to ignore repeated updates or
   * to restore the correct update sequence, should they get out of order. If
   * there are no new updates for at least a week, then identifier of the next
   * update will be chosen randomly instead of sequentially.
   */
  get updateId() {
    return this.payload.update_id;
  }
}

abstract class MessageEquivalence extends EventBase {
  abstract get message(): RawMessage;

  /** The chat to which the message belongs */
  get thread(): TelegramChat {
    const rawChat = this.message.chat;
    return new TelegramChat(this.botId, rawChat.id, rawChat);
  }

  /** Unique message identifier inside this chat */
  get messageId(): number {
    return this.message.message_id;
  }

  /** Raw user object represent the sender, empty for messages sent to channels */
  get from(): RawUser | undefined {
    return this.message.from;
  }

  /** Date the message was sent in Unix time */
  get time(): Date {
    return new Date(this.message.date * 1000);
  }

  /** Conversation the message belongs to */
  get chat(): RawChat {
    return this.message.chat;
  }

  /**
   * For replies, the original message. Note that the Message object in this
   * field will not contain furth
   */
  get replyToMessage(): RawMessage | undefined {
    return this.message.reply_to_message;
  }

  /** Bot through which the message was sent */
  get viaBot(): RawUser | undefined {
    return this.message.via_bot;
  }

  /** Date the message was last edited in Unix time */
  get editDate(): number | undefined {
    return this.message.edit_date;
  }

  /** The unique identifier of a media message group this message belongs to */
  get mediaGroupId(): string | undefined {
    return this.message.media_group_id;
  }

  /** Signature of the post author for messages in channels */
  get authorSignature(): string | undefined {
    return this.message.author_signature;
  }

  /** The domain name of the website on which the user has logged in. */
  get connectedWebsite(): string | undefined {
    return this.message.connected_website;
  }

  /** Telegram Passport data */
  get passportData(): RawPassportData | undefined {
    return this.message.passport_data;
  }

  /**
   * Inline keyboard attached to the message. login_url buttons are represented
   * as ordinary url buttons.
   */
  get replyMarkup(): RawInlineKeyboardMarkup | undefined {
    return this.message.reply_markup;
  }
}

class Message extends MessageEquivalence {
  /** Message object */
  get message(): RawMessage {
    return this.payload.message!;
  }

  /** The user triggering the event */
  get user(): TelegramUser | TelegramChatSender {
    const rawMessage = this.message;
    if (rawMessage.sender_chat) {
      return new TelegramChatSender(rawMessage.sender_chat);
    }
    const rawUser = rawMessage.from!;
    return new TelegramUser(rawUser.id, undefined, rawUser);
  }

  get time(): Date {
    return new Date(this.message.date * 1000);
  }
}

class EditedMessage extends MessageEquivalence {
  /** Message object */
  get message(): RawMessage {
    return this.payload.edited_message!;
  }

  /** The user triggering the event */
  get user(): TelegramUser {
    const fromUser = this.payload.edited_message!.from!;
    return new TelegramUser(fromUser.id, undefined, fromUser);
  }
}

class ChannelPost extends MessageEquivalence {
  /** Message object */
  get message(): RawMessage {
    return this.payload.channel_post!;
  }

  /** The user triggering the event */
  get user(): TelegramChatSender {
    const rawSenderChat = this.payload.channel_post!.sender_chat!;
    return new TelegramChatSender(rawSenderChat);
  }
}

class EditedChannelPost extends MessageEquivalence {
  /** Message object */
  get message(): RawMessage {
    return this.payload.edited_channel_post!;
  }

  /** The user triggering the event */
  get user(): TelegramChatSender {
    const rawSenderChat = this.payload.edited_channel_post!.sender_chat!;
    return new TelegramChatSender(rawSenderChat);
  }
}
abstract class Text extends MessageEquivalence {
  /** The actual UTF-8 text of the message, 0-4096 characters */
  get text(): string {
    return this.message.text!;
  }

  /**
   * For text messages, special entities like usernames, URLs, sender commands,
   * etc. that appear in the text
   */
  get entities(): RawMessageEntity[] | undefined {
    return this.message.entities;
  }
}

abstract class FileEquivalence extends MessageEquivalence {
  abstract file: RawFile;

  /** Identifier for this file, which can be used to download or reuse the file */
  get fileId(): string {
    return this.file.file_id;
  }

  /**
   * Unique identifier for this file, which is supposed to be the same over time
   * and for different bots. Can't be used to download or reuse the file.
   */
  get fileUniqueId(): string {
    return this.file.file_unique_id;
  }

  /** MIME type of the file as defined by sender */
  get mimeType(): string | undefined {
    return this.file.mime_type;
  }

  /** File size */
  get fileSize(): number | undefined {
    return this.file.file_size;
  }

  /** File thumbnail as defined by sender if available */
  get thumbnail(): RawPhotoSize | undefined {
    return this.file.thumbnail;
  }

  /** Original filename as defined by sender if available */
  get fileName(): string | undefined {
    return this.file.file_name;
  }
}

abstract class Animation extends FileEquivalence {
  get file(): RawFile {
    return this.message.animation!;
  }

  /** Animation object. */
  get animation(): RawAnimation {
    return this.message.animation!;
  }

  /** Video width as defined by sender */
  get width(): number {
    return this.message.animation!.width;
  }

  /** Video height as defined by sender */
  get height(): number {
    return this.message.animation!.height;
  }

  /** Duration of the video in seconds as defined by sender */
  get duration(): number {
    return this.message.animation!.duration;
  }
}

abstract class Audio extends FileEquivalence {
  /** File object. */
  get file(): RawFile {
    return this.message.audio!;
  }

  /** Audio object. */
  get audio(): RawAudio {
    return this.message.audio!;
  }

  /** Duration of the audio in seconds as defined by sender */
  get duration(): number {
    return this.message.audio!.duration;
  }

  /** Performer of the audio as defined by sender or by audio tags */
  get performer(): string | undefined {
    return this.message.audio!.performer;
  }

  /** Title of the audio as defined by sender or by audio tags */
  get title(): string | undefined {
    return this.message.audio!.title;
  }
}

abstract class Document extends FileEquivalence {
  /** File object. */
  get file(): RawFile {
    return this.message.document!;
  }

  /** Document object */
  get document(): RawDocument {
    return this.message.document!;
  }
}

abstract class Photo extends MessageEquivalence {
  get file(): RawFile {
    return this.message.photo!.at(-1)!;
  }

  /** Available sizes of the photo */
  get photo(): RawPhotoSize[] {
    return this.message.photo!;
  }
}

abstract class Sticker extends FileEquivalence {
  /** File object. */
  get file(): RawFile {
    return this.message.sticker!;
  }

  /** Sticker object. */
  get sticker(): RawSticker {
    return this.message.sticker!;
  }

  /** Sticker width */
  get width(): number {
    return this.message.sticker!.width;
  }

  /** Sticker height */
  get height(): number {
    return this.message.sticker!.height;
  }

  /** True if the sticker is animated */
  get isAnimated(): boolean | undefined {
    return this.message.sticker!.is_animated;
  }

  /** Emoji associated with the sticker */
  get emoji(): string | undefined {
    return this.message.sticker!.emoji;
  }

  /** Name of the sticker set to which the sticker belongs */
  get setName(): string | undefined {
    return this.message.sticker!.set_name;
  }

  /** For mask stickers, the position where the mask should be placed */
  get maskPosition(): RawMaskPosition | undefined {
    return this.message.sticker!.mask_position;
  }
}

abstract class Video extends FileEquivalence {
  /** File object. */
  get file(): RawFile {
    return this.message.video!;
  }

  /** Video object. */
  get video(): RawVideo {
    return this.message.video!;
  }

  /** Video width as defined by sender */
  get width(): number {
    return this.message.video!.width;
  }

  /** Video height as defined by sender */
  get height(): number {
    return this.message.video!.height;
  }

  /** Duration of the video in seconds as defined by sender */
  get duration(): number {
    return this.message.video!.duration;
  }
}

abstract class VideoNote extends FileEquivalence {
  /** File object. */
  get file(): RawFile {
    return this.message.video_note!;
  }

  /** Video note object. */
  get videoNote(): RawVideoNote {
    return this.message.video_note!;
  }

  /** Video width and height (diameter of the video message) as defined by sender */
  get length(): number {
    return this.message.video_note!.length;
  }

  /** Duration of the video in seconds as defined by sender */
  get duration(): number {
    return this.message.video_note!.duration;
  }
}

abstract class Voice extends FileEquivalence {
  /** File object. */
  get file(): RawFile {
    return this.message.voice!;
  }

  /** Voice object. */
  get voice(): RawVoice {
    return this.message.voice!;
  }

  /** Duration of the audio in seconds as defined by sender */
  get duration(): number {
    return this.message.voice!.duration;
  }
}

abstract class Caption extends MessageEquivalence {
  /**
   * Caption for the animation, audio, document, photo, video or voice, 0-1024
   * characters
   */
  get caption(): string | undefined {
    return this.message.caption;
  }

  /**
   * For messages with a caption, special entities like usernames, URLs, sender
   * commands, etc. that appear in the caption
   */
  get captionEntities(): RawMessageEntity[] | undefined {
    return this.message.caption_entities;
  }
}

abstract class Contact extends MessageEquivalence {
  /** Contact object. */
  get contact(): RawContact {
    return this.message.contact!;
  }

  /** Contact's phone number */
  get phoneNumber(): string {
    return this.message.contact!.phone_number;
  }

  /** Contact's first name */
  get firstName(): string {
    return this.message.contact!.first_name;
  }

  /** Contact's last name */
  get lastName(): string | undefined {
    return this.message.contact!.last_name;
  }

  /** Contact's user identifier in Telegram */
  get userId(): number | undefined {
    return this.message.contact!.user_id;
  }

  /** Additional data about the contact in the form of a vCard */
  get vcard(): string | undefined {
    return this.message.contact!.vcard;
  }
}

abstract class Dice extends MessageEquivalence {
  /** Dice object. */
  get dice(): RawDice {
    return this.message.dice!;
  }

  /** Emoji on which the dice throw animation is based */
  get emoji(): string {
    return this.message.dice!.emoji;
  }

  /**
   * Value of the dice, 1-6 for “🎲” and “🎯” base emoji, 1-5 for “🏀” base
   * emoji
   */
  get value(): number {
    return this.message.dice!.value;
  }
}

abstract class Game extends MessageEquivalence {
  /** Game object. */
  get game(): RawGame {
    return this.message.game!;
  }

  /** Title of the game */
  get title(): string {
    return this.message.game!.title;
  }

  /** Description of the game */
  get description(): string {
    return this.message.game!.description;
  }

  /** Photo that will be displayed in the game message in chats. */
  get photo(): RawPhotoSize[] {
    return this.message.game!.photo;
  }

  /**
   * Brief description of the game or high scores included in the game message.
   * Can be automatically edited to include current high scores for the game
   * when the sender calls setGameScore, or manually edited using
   * editMessageText. 0-4096 characters.
   */
  get text(): string | undefined {
    return this.message.game!.text;
  }

  /**
   * Special entities that appear in text, such as usernames, URLs, sender
   * commands, etc.
   */
  get textEntities(): RawMessageEntity[] | undefined {
    return this.message.game!.text_entities;
  }

  /**
   * Animation that will be displayed in the game message in chats. Upload via
   * BotFather
   */
  get animation(): RawAnimation | undefined {
    return this.message.game!.animation;
  }
}

abstract class Poll extends EventBase {
  /** Poll object. */
  abstract get poll(): RawPoll;

  /** Unique poll identifier */
  get pollId(): string {
    return this.poll.id;
  }

  /** Poll question, 1-255 characters */
  get question(): string {
    return this.poll.question;
  }

  /** List of poll options */
  get options(): RawPollOption[] {
    return this.poll.options;
  }

  /** Total number of users that voted in the poll */
  get totalVoterCount(): number {
    return this.poll.total_voter_count;
  }

  /** True, if the poll is closed */
  get isClosed(): boolean {
    return this.poll.is_closed;
  }

  /** True, if the poll is anonymous */
  get isAnonymous(): boolean {
    return this.poll.is_anonymous;
  }

  /** Poll type, currently can be “regular” or “quiz” */
  get pollType(): string {
    return this.poll.type;
  }

  /** True, if the poll allows multiple answers */
  get allowsMultipleAnswers(): boolean {
    return this.poll.allows_multiple_answers;
  }

  /**
   * 0-based identifier of the correct answer option. Available only for polls
   * in the quiz mode, which are closed, or was sent (not forwarded) by the
   * sender or to the private chat with the sender.
   */
  get correctOptionId(): number | undefined {
    return this.poll.correct_option_id;
  }

  /**
   * Text that is shown when a user chooses an incorrect answer or taps on the
   * lamp icon in a quiz-style poll, 0-200 characters
   */
  get explanation(): string | undefined {
    return this.poll.explanation;
  }

  /**
   * Special entities like usernames, URLs, sender commands, etc. that appear in
   * the explanation
   */
  get explanationEntities(): RawMessageEntity[] | undefined {
    return this.poll.explanation_entities;
  }

  /** Amount of time in seconds the poll will be active after creation */
  get openPeriod(): number | undefined {
    return this.poll.open_period;
  }

  /** Point in time when the poll will be automatically closed */
  get closeDate(): Date | undefined {
    return this.poll.close_date
      ? new Date(this.poll.close_date * 1000)
      : undefined;
  }
}

abstract class MessagePoll extends MessageEquivalence {
  /** Poll object. */
  get poll(): RawPoll {
    return this.message.poll!;
  }
}

abstract class Venue extends MessageEquivalence {
  /** Venue object. */
  get venue(): RawVenue {
    return this.message.venue!;
  }

  /** Venue location */
  get location(): RawLocation {
    return this.message.venue!.location;
  }

  /** Name of the venue */
  get title(): string {
    return this.message.venue!.title;
  }

  /** Address of the venue */
  get address(): string {
    return this.message.venue!.address;
  }

  /** Foursquare identifier of the venue */
  get foursquareId(): string | undefined {
    return this.message.venue!.foursquare_id;
  }

  /**
   * Foursquare type of the venue. (For example, “arts_entertainment/default”,
   * “arts_entertainment/aquarium” or “food/icecream”.)
   */
  get foursquareType(): string | undefined {
    return this.message.venue!.foursquare_type;
  }
}

abstract class Location extends MessageEquivalence {
  /** Location object. */
  get location(): RawLocation {
    return this.message.location!;
  }

  /** Longitude as defined by sender */
  get longitude(): number {
    return this.message.location!.longitude;
  }

  /** Latitude as defined by sender */
  get latitude(): number {
    return this.message.location!.latitude;
  }
}

abstract class NewChatMembers extends MessageEquivalence {
  /**
   * New members that were added to the group or supergroup and information
   * about them (the sender itself may be one of these members)
   */
  get newChatMembers(): TelegramUser[] {
    return this.message.new_chat_members!.map(
      (rawUser: RawUser) => new TelegramUser(rawUser.id, undefined, rawUser),
    );
  }
}

abstract class LeftChatMember extends MessageEquivalence {
  /**
   * A member was removed from the group, information about them (this member
   * may be the sender itself)
   */
  get leftChatMember(): TelegramUser {
    const leftMember: RawUser = this.message.left_chat_member!;
    return new TelegramUser(leftMember.id, undefined, leftMember);
  }
}

abstract class NewChatTitle extends MessageEquivalence {
  /** A chat title was changed to this value */
  get newChatTitle(): string {
    return this.message.new_chat_title!;
  }
}

abstract class NewChatPhoto extends MessageEquivalence {
  /** A chat photo was changed to this value. */
  get newChatPhoto(): RawPhotoSize[] {
    return this.message.new_chat_photo!;
  }
}

abstract class MigrateToChatId extends MessageEquivalence {
  /**
   * This number may be greater than 32 bits and some programming languages may
   * have difficulty/silent defects in interpreting it. But it is smaller than
   * 52 bits, so a signed 64 bit integer or double-precision float type are safe
   * for storing this identifier.
   */
  get migrateToChatId(): number {
    return this.message.migrate_to_chat_id!;
  }
}

abstract class MigrateFromChatId extends MessageEquivalence {
  /**
   * This number may be greater than 32 bits and some programming languages may
   * have difficulty/silent defects in interpreting it. But it is smaller than
   * 52 bits, so a signed 64 bit integer or double-precision float type are safe
   * for storing this identifier.
   */
  get migrateFromChatId(): number {
    return this.message.migrate_from_chat_id!;
  }
}

abstract class PinnedMessage extends MessageEquivalence {
  /**
   * Pinned message object. Note that the Message object in this field will not
   * contain further reply_to_message fields even if it is itself a reply.
   */
  get pinnedMessage(): RawMessage {
    return this.message.pinned_message!;
  }
}

abstract class SuccessfulPayment extends MessageEquivalence {
  /** Successful payment information object. */
  get successfulPayment(): RawSuccessfulPayment {
    return this.message.successful_payment!;
  }

  /** Three-letter ISO 4217 currency code */
  get currency(): string {
    return this.message.successful_payment!.currency;
  }

  /**
   * Total price in the smallest units of the currency (integer, not
   * float/double). For example, for a price of US$ 1.45 pass amount = 145. See
   * the exp parameter in currencies.json, it shows the number of digits past
   * the decimal point for each currency (2 for the majority of currencies).
   */
  get totalAmount(): number {
    return this.message.successful_payment!.total_amount;
  }

  /** Bot specified invoice payload */
  get invoicePayload(): string {
    return this.message.successful_payment!.invoice_payload;
  }

  /** Identifier of the shipping option chosen by the user */
  get shippingOptionId(): string | undefined {
    return this.message.successful_payment!.shipping_option_id;
  }

  /** Order info provided by the user */
  get orderInfo(): RawOrderInfo | undefined {
    return this.message.successful_payment!.order_info;
  }

  /** Telegram payment identifier */
  get telegramPaymentChargeId(): string {
    return this.message.successful_payment!.telegram_payment_charge_id;
  }

  /** Provider payment identifier */
  get providerPaymentChargeId(): string {
    return this.message.successful_payment!.provider_payment_charge_id;
  }
}

abstract class InlineQuery extends EventBase {
  /** The sender scoped thread */
  readonly thread = null;

  /** Sender */
  get user(): TelegramUser {
    const rawUser = this.payload.inline_query!.from;
    return new TelegramUser(rawUser.id, false, rawUser);
  }

  /** Inline query object. */
  get inlineQuery(): RawInlineQuery {
    return this.payload.inline_query!;
  }

  /** Unique identifier for this query */
  get queryId(): string {
    return this.payload.inline_query!.id;
  }

  /** Sender location, only for bots that request user location */
  get location(): RawLocation | undefined {
    return this.payload.inline_query!.location;
  }

  /** Text of the query (up to 256 characters) */
  get query(): string {
    return this.payload.inline_query!.query;
  }

  /** Offset of the results to be returned, can be controlled by the sender */
  get offset(): string | undefined {
    return this.payload.inline_query!.offset;
  }

  readonly callbackData = undefined;
}

abstract class ChosenInlineResult extends EventBase {
  readonly thread = null;
  /** The user that chose the result */
  get user(): TelegramUser {
    const rawUser = this.payload.chosen_inline_result!.from;
    return new TelegramUser(rawUser.id, false, rawUser);
  }

  /** Inline result object. */
  get chosenInlineResult(): RawChosenInlineResult {
    return this.payload.chosen_inline_result!;
  }

  /** The unique identifier for the result that was chosen */
  get resultId(): string {
    return this.payload.chosen_inline_result!.result_id;
  }

  /** Sender location, only for bots that require user location */
  get location(): RawLocation | undefined {
    return this.payload.chosen_inline_result!.location;
  }

  /**
   * Identifier of the sent inline message. Available only if there is an inline
   * keyboard attached to the message. Will be also received in callback queries
   * and can be used to edit the message.
   */
  get inlineMessageId(): string | undefined {
    return this.payload.chosen_inline_result!.inline_message_id;
  }

  /** The query that was used to obtain the result */
  get query(): string {
    return this.payload.chosen_inline_result!.query;
  }

  readonly callbackData = undefined;
}

abstract class CallbackBase extends EventBase {
  /**
   * The chat thread. If the callback is triggered by an inline message, it's a
   * sender scoped thread
   */
  get thread(): TelegramChat | null {
    const { message } = this.payload.callback_query!;
    return message
      ? new TelegramChat(this.botId, message.chat.id, message.chat)
      : null;
  }

  /** Sender */
  get user(): TelegramUser {
    const rawUser = this.payload.callback_query!.from;
    return new TelegramUser(rawUser.id, false, rawUser);
  }

  /** Callback query object. */
  get callbackQuery(): RawCallbackQuery {
    return this.payload.callback_query!;
  }

  /** Unique identifier for this query */
  get queryId(): string {
    return this.payload.callback_query!.id;
  }

  /**
   * Message with the callback button that originated the query. Note that
   * message content and message date will not be available if the message is
   * too old
   */
  get message(): RawMessage | undefined {
    return this.payload.callback_query!.message;
  }

  /**
   * Identifier of the message sent via the sender in inline mode, that
   * originated the query.
   */
  get inlineMessageId(): string | undefined {
    return this.payload.callback_query!.inline_message_id;
  }

  /**
   * Global identifier, uniquely corresponding to the chat to which the message
   * with the callback button was sent. Useful for high scores in games.
   */
  get chatInstanceId(): string {
    return this.payload.callback_query!.chat_instance;
  }
}

abstract class CallbackQuery extends EventBase {
  /**
   * Data associated with the callback button. Be aware that a bad client can
   * send arbitrary data in this field.
   */
  get callbackData(): string {
    return this.payload.callback_query!.data!;
  }
}

abstract class CallbackGame extends EventBase {
  /**
   * Short name of a Game to be returned, serves as the unique identifier for
   * the game
   */
  get gameShortName(): string {
    return this.payload.callback_query!.game_short_name!;
  }

  callbackData?: undefined;
}

abstract class ShippingQuery extends EventBase {
  /** The chat thread */
  get thread(): TelegramChat {
    return TelegramChat.fromUser(this.botId, this.payload.shipping_query!.from);
  }

  /** User who sent the query */
  get user(): TelegramUser {
    const rawUser = this.payload.shipping_query!.from;
    return new TelegramUser(rawUser.id, false, rawUser);
  }

  /** Shipping query object. */
  get shippingQuery(): RawShippingQuery {
    return this.payload.shipping_query!;
  }

  /** Unique query identifier */
  get queryId(): string {
    return this.payload.shipping_query!.id;
  }

  /** Bot specified invoice payload */
  get invoicePayload(): string {
    return this.payload.shipping_query!.invoice_payload;
  }

  /** User specified shipping address */
  get shippingAddress(): RawShippingAddress {
    return this.payload.shipping_query!.shipping_address;
  }

  callbackData?: undefined;
}

abstract class PreCheckoutQuery extends EventBase {
  /** The chat thread */
  get thread(): TelegramChat {
    return TelegramChat.fromUser(
      this.botId,
      this.payload.pre_checkout_query!.from,
    );
  }

  /** User who sent the query */
  get user(): TelegramUser {
    const rawUser = this.payload.pre_checkout_query!.from;
    return new TelegramUser(rawUser.id, false, rawUser);
  }

  /** Pre-checkout query object. */
  get preCheckoutQuery(): RawPreCheckoutQuery {
    return this.payload.pre_checkout_query!;
  }

  /** Unique query identifier */
  get queryId(): string {
    return this.payload.pre_checkout_query!.id;
  }

  /** Three-letter ISO 4217 currency code */
  get currency(): string {
    return this.payload.pre_checkout_query!.currency;
  }

  /**
   * Total price in the smallest units of the currency (integer, not
   * float/double). For example, for a price of US$ 1.45 pass amount = 145. See
   * the exp parameter in currencies.json, it shows the number of digits past
   * the decimal point for each currency (2 for the majority of currencies).
   */
  get totalAmount(): number {
    return this.payload.pre_checkout_query!.total_amount;
  }

  /** Bot specified invoice payload */
  get invoicePayload(): string | undefined {
    return this.payload.pre_checkout_query!.invoice_payload;
  }

  /** Identifier of the shipping option chosen by the user */
  get shippingOptionId(): string | undefined {
    return this.payload.pre_checkout_query!.shipping_option_id;
  }

  /** Order info provided by the user */
  get orderInfo(): RawOrderInfo | undefined {
    return this.payload.pre_checkout_query!.order_info;
  }

  callbackData?: undefined;
}

abstract class PollChange extends EventBase {
  /** The chat thread */
  readonly thread = null;
  /** User is null for poll updates */
  readonly user = null;
  /** Poll object. */
  get poll(): RawPoll {
    return this.payload.poll!;
  }

  callbackData?: undefined;
}

abstract class PollAnswer extends EventBase {
  /** The chat thread */
  readonly thread = null;
  /** The user, who changed the answer to the poll */
  get user(): TelegramUser | null {
    const rawUser = this.payload.poll_answer!.user;
    return rawUser ? new TelegramUser(rawUser.id, false, rawUser) : null;
  }

  /** Poll answer object. */
  get pollAnswer(): RawPollAnswer {
    return this.payload.poll_answer!;
  }

  /** Unique poll identifier */
  get pollId(): string {
    return this.payload.poll_answer!.poll_id;
  }

  /**
   * 0-based identifiers of answer options, chosen by the user. May be empty if
   * the user retracted their vote.
   */
  get optionIds(): number[] {
    return this.payload.poll_answer!.option_ids;
  }

  callbackData?: undefined;
}

type MemberStatus =
  | 'creator'
  | 'administrator'
  | 'member'
  | 'restricted'
  | 'left'
  | 'kicked';

abstract class ChatMemberUpdated extends EventBase {
  /** Chat member update object. */
  abstract get chatMemberUpdated(): RawChatMemberUpdated;

  get thread(): TelegramChat {
    const rawChat = this.chatMemberUpdated.chat;
    return new TelegramChat(this.botId, rawChat.id, rawChat);
  }

  /** The user who performed the action */
  get user(): TelegramUser {
    const rawUser: RawUser = this.chatMemberUpdated.from;
    return new TelegramUser(rawUser.id, undefined, rawUser);
  }

  /** Date the change was done */
  get date(): Date {
    return new Date(this.chatMemberUpdated.date * 1000);
  }

  /** The updated chat member */
  get updatedUser(): TelegramUser {
    const rawUser: RawUser = this.chatMemberUpdated.new_chat_member.user;
    return new TelegramUser(rawUser.id, undefined, rawUser);
  }

  get oldStatus(): MemberStatus {
    return this.chatMemberUpdated.old_chat_member.status;
  }

  get newStatus(): MemberStatus {
    return this.chatMemberUpdated.new_chat_member.status;
  }
}

class ChatMember extends EventBase {
  get chatMember() {
    return this.payload.chat_member;
  }
}

class MyChatMember extends EventBase {
  get chatMember() {
    return this.payload.my_chat_member;
  }
}

class Unknown extends EventBase {
  readonly user: null = null;
  readonly thread: null = null;
}

@mixin([MessageEquivalence, Message, Text])
export class TextMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'text' as const;
}
export interface TextMessageEvent extends Message, Text {}

@mixin([MessageEquivalence, EditedMessage, Text])
export class EditTextMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'text' as const;
}
export interface EditTextMessageEvent extends EditedMessage, Text {}

@mixin([MessageEquivalence, ChannelPost, Text])
export class TextChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'text' as const;
}
export interface TextChannelPostEvent extends ChannelPost, Text {}

@mixin([MessageEquivalence, EditedChannelPost, Text])
export class EditTextChannelPostEvent extends EventBase {
  kind = 'edit_channel_post' as const;
  type = 'text' as const;
}
export interface EditTextChannelPostEvent extends EditedChannelPost, Text {}

@mixin([MessageEquivalence, Message, FileEquivalence, Animation, Caption])
export class AnimationMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'animation' as const;
}
export interface AnimationMessageEvent extends Message, Animation, Caption {}

@mixin([MessageEquivalence, EditedMessage, FileEquivalence, Animation, Caption])
export class EditAnimationMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'animation' as const;
}
export interface EditAnimationMessageEvent
  extends EditedMessage,
    Animation,
    Caption {}

@mixin([MessageEquivalence, ChannelPost, FileEquivalence, Animation, Caption])
export class AnimationChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'animation' as const;
}
export interface AnimationChannelPostEvent
  extends ChannelPost,
    Animation,
    Caption {}

@mixin([
  MessageEquivalence,
  EditedChannelPost,
  FileEquivalence,
  Animation,
  Caption,
])
export class EditAnimationChannelPostEvent extends EventBase {
  kind = 'edit_channel_post' as const;
  type = 'animation' as const;
}
export interface EditAnimationChannelPostEvent
  extends EditedChannelPost,
    Animation,
    Caption {}

@mixin([MessageEquivalence, Message, FileEquivalence, Audio, Caption])
export class AudioMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'audio' as const;
}
export interface AudioMessageEvent extends Message, Audio, Caption {}

@mixin([MessageEquivalence, EditedMessage, FileEquivalence, Audio, Caption])
export class EditAudioMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'audio' as const;
}
export interface EditAudioMessageEvent extends EditedMessage, Audio, Caption {}

@mixin([MessageEquivalence, ChannelPost, FileEquivalence, Audio, Caption])
export class AudioChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'audio' as const;
}
export interface AudioChannelPostEvent extends ChannelPost, Audio, Caption {}

@mixin([MessageEquivalence, EditedChannelPost, FileEquivalence, Audio, Caption])
export class EditAudioChannelPostEvent extends EventBase {
  kind = 'edit_channel_post' as const;
  type = 'audio' as const;
}
export interface EditAudioChannelPostEvent
  extends EditedChannelPost,
    Audio,
    Caption {}

@mixin([MessageEquivalence, Message, FileEquivalence, Document, Caption])
export class DocumentMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'document' as const;
}
export interface DocumentMessageEvent extends Message, Document, Caption {}

@mixin([MessageEquivalence, EditedMessage, FileEquivalence, Document, Caption])
export class EditDocumentMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'document' as const;
}
export interface EditDocumentMessageEvent
  extends EditedMessage,
    Document,
    Caption {}

@mixin([MessageEquivalence, ChannelPost, FileEquivalence, Document, Caption])
export class DocumentChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'document' as const;
}
export interface DocumentChannelPostEvent
  extends ChannelPost,
    Document,
    Caption {}

@mixin([
  MessageEquivalence,
  EditedChannelPost,
  FileEquivalence,
  Document,
  Caption,
])
export class EditDocumentChannelPostEvent extends EventBase {
  kind = 'edit_channel_post' as const;
  type = 'document' as const;
}
export interface EditDocumentChannelPostEvent
  extends EditedChannelPost,
    Document,
    Caption {}

@mixin([MessageEquivalence, Message, FileEquivalence, Photo, Caption])
export class PhotoMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'photo' as const;
}
export interface PhotoMessageEvent extends Message, Photo, Caption {}

@mixin([MessageEquivalence, EditedMessage, FileEquivalence, Photo, Caption])
export class EditPhotoMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'photo' as const;
}
export interface EditPhotoMessageEvent extends EditedMessage, Photo, Caption {}

@mixin([MessageEquivalence, ChannelPost, FileEquivalence, Photo, Caption])
export class PhotoChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'photo' as const;
}
export interface PhotoChannelPostEvent extends ChannelPost, Photo, Caption {}

@mixin([MessageEquivalence, EditedChannelPost, FileEquivalence, Photo, Caption])
export class EditPhotoChannelPostEvent extends EventBase {
  kind = 'edit_channel_post' as const;
  type = 'photo' as const;
}
export interface EditPhotoChannelPostEvent
  extends EditedChannelPost,
    Photo,
    Caption {}

@mixin([MessageEquivalence, Message, FileEquivalence, Sticker, Caption])
export class StickerMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'sticker' as const;
}
export interface StickerMessageEvent extends Message, Sticker, Caption {}

@mixin([MessageEquivalence, EditedMessage, FileEquivalence, Sticker, Caption])
export class EditStickerMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'sticker' as const;
}
export interface EditStickerMessageEvent
  extends EditedMessage,
    Sticker,
    Caption {}

@mixin([MessageEquivalence, ChannelPost, FileEquivalence, Sticker, Caption])
export class StickerChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'sticker' as const;
}
export interface StickerChannelPostEvent
  extends ChannelPost,
    Sticker,
    Caption {}

@mixin([
  MessageEquivalence,
  EditedChannelPost,
  FileEquivalence,
  Sticker,
  Caption,
])
export class EditStickerChannelPostEvent extends EventBase {
  kind = 'edit_channel_post' as const;
  type = 'sticker' as const;
}
export interface EditStickerChannelPostEvent
  extends EditedChannelPost,
    Sticker,
    Caption {}

@mixin([MessageEquivalence, Message, FileEquivalence, Video, Caption])
export class VideoMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'video' as const;
}
export interface VideoMessageEvent extends Message, Video, Caption {}

@mixin([MessageEquivalence, EditedMessage, FileEquivalence, Video, Caption])
export class EditVideoMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'video' as const;
}
export interface EditVideoMessageEvent extends EditedMessage, Video, Caption {}

@mixin([MessageEquivalence, ChannelPost, FileEquivalence, Video, Caption])
export class VideoChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'video' as const;
}
export interface VideoChannelPostEvent extends ChannelPost, Video, Caption {}

@mixin([MessageEquivalence, EditedChannelPost, FileEquivalence, Video, Caption])
export class EditVideoChannelPostEvent extends EventBase {
  kind = 'edit_channel_post' as const;
  type = 'video' as const;
}
export interface EditVideoChannelPostEvent
  extends EditedChannelPost,
    Video,
    Caption {}

@mixin([MessageEquivalence, Message, FileEquivalence, VideoNote, Caption])
export class VideoNoteMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'video_note' as const;
}
export interface VideoNoteMessageEvent extends Message, VideoNote, Caption {}

@mixin([MessageEquivalence, ChannelPost, FileEquivalence, VideoNote, Caption])
export class VideoNoteChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'video_note' as const;
}
export interface VideoNoteChannelPostEvent
  extends ChannelPost,
    VideoNote,
    Caption {}

@mixin([MessageEquivalence, Message, FileEquivalence, Voice, Caption])
export class VoiceMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'voice' as const;
}
export interface VoiceMessageEvent extends Message, Voice, Caption {}

@mixin([MessageEquivalence, EditedMessage, FileEquivalence, Voice, Caption])
export class EditVoiceMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'voice' as const;
}
export interface EditVoiceMessageEvent extends EditedMessage, Voice, Caption {}

@mixin([MessageEquivalence, ChannelPost, FileEquivalence, Voice, Caption])
export class VoiceChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'voice' as const;
}
export interface VoiceChannelPostEvent extends ChannelPost, Voice, Caption {}

@mixin([MessageEquivalence, EditedChannelPost, FileEquivalence, Voice, Caption])
export class EditVoiceChannelPostEvent extends EventBase {
  kind = 'edit_channel_post' as const;
  type = 'voice' as const;
}
export interface EditVoiceChannelPostEvent
  extends EditedChannelPost,
    Voice,
    Caption {}

@mixin([MessageEquivalence, Message, Contact])
export class ContactMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'contact' as const;
}
export interface ContactMessageEvent extends Message, Contact {}

@mixin([MessageEquivalence, ChannelPost, Contact])
export class ContactChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'contact' as const;
}
export interface ContactChannelPostEvent extends ChannelPost, Contact {}

@mixin([MessageEquivalence, Message, Dice])
export class DiceMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'dice' as const;
}
export interface DiceMessageEvent extends Message, Dice {}

@mixin([MessageEquivalence, ChannelPost, Dice])
export class DiceChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'dice' as const;
}
export interface DiceChannelPostEvent extends ChannelPost, Dice {}

@mixin([MessageEquivalence, Message, Game])
export class GameMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'game' as const;
}
export interface GameMessageEvent extends Message, Game {}

@mixin([MessageEquivalence, EditedMessage, Game])
export class EditGameMessageEvent extends EventBase {
  kind = 'edit_message' as const;
  type = 'game' as const;
}
export interface EditGameMessageEvent extends EditedMessage, Game {}

@mixin([MessageEquivalence, Message, Poll, MessagePoll])
export class PollMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'poll' as const;
}
export interface PollMessageEvent extends Message, Poll, MessagePoll {}

@mixin([MessageEquivalence, ChannelPost, Poll, MessagePoll])
export class PollChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'poll' as const;
}
export interface PollChannelPostEvent extends ChannelPost, Poll, MessagePoll {}

@mixin([MessageEquivalence, Message, Venue])
export class VenueMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'venue' as const;
}
export interface VenueMessageEvent extends Message, Venue {}

@mixin([MessageEquivalence, ChannelPost, Venue])
export class VenueChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'venue' as const;
}
export interface VenueChannelPostEvent extends ChannelPost, Venue {}

@mixin([MessageEquivalence, Message, Location])
export class LocationMessageEvent extends EventBase {
  kind = 'message' as const;
  type = 'location' as const;
}
export interface LocationMessageEvent extends Message, Location {}

@mixin([MessageEquivalence, ChannelPost, Location])
export class LocationChannelPostEvent extends EventBase {
  kind = 'channel_post' as const;
  type = 'location' as const;
}
export interface LocationChannelPostEvent extends ChannelPost, Location {}

@mixin([MessageEquivalence, Message, NewChatMembers])
export class NewChatMembersActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'new_chat_members' as const;
}
export interface NewChatMembersActionEvent extends Message, NewChatMembers {}

@mixin([MessageEquivalence, Message, LeftChatMember])
export class LeftChatMemberActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'left_chat_member' as const;
}
export interface LeftChatMemberActionEvent extends Message, LeftChatMember {}

@mixin([MessageEquivalence, Message, NewChatTitle])
export class NewChatTitleActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'new_chat_title' as const;
}
export interface NewChatTitleActionEvent extends Message, NewChatTitle {}

@mixin([MessageEquivalence, Message, NewChatPhoto])
export class NewChatPhotoActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'new_chat_photo' as const;
}
export interface NewChatPhotoActionEvent extends Message, NewChatPhoto {}

@mixin([MessageEquivalence, Message])
export class DeleteChatPhotoActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'delete_chat_photo' as const;
}
export interface DeleteChatPhotoActionEvent extends Message {}

@mixin([MessageEquivalence, Message])
export class CreateGroupChatActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'create_group_chat' as const;
}
export interface CreateGroupChatActionEvent extends Message {}

@mixin([MessageEquivalence, Message, MigrateToChatId])
export class MigrateToChatActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'migrate_to_chat' as const;
}
export interface MigrateToChatActionEvent extends Message, MigrateToChatId {}

@mixin([MessageEquivalence, Message, MigrateFromChatId])
export class MigrateFromChatActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'migrate_from_chat' as const;
}
export interface MigrateFromChatActionEvent
  extends Message,
    MigrateFromChatId {}

@mixin([MessageEquivalence, Message, PinnedMessage])
export class PinMessageActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'pin_message' as const;
}
export interface PinMessageActionEvent extends Message, PinnedMessage {}

@mixin([MessageEquivalence, Message, SuccessfulPayment])
export class SuccessfulPaymentCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'successful_payment' as const;
}
export interface SuccessfulPaymentCallbackEvent
  extends Message,
    SuccessfulPayment {}

@mixin([InlineQuery])
export class InlineQueryCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'inline_query' as const;
}
export interface InlineQueryCallbackEvent extends InlineQuery {}

@mixin([ChosenInlineResult])
export class ChooseInlineResultCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'choose_inline_result' as const;
}
export interface ChooseInlineResultCallbackEvent extends ChosenInlineResult {}

@mixin([CallbackBase, CallbackQuery])
export class CallbackQueryCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'callback_query' as const;
}
export interface CallbackQueryCallbackEvent
  extends CallbackBase,
    CallbackQuery {}

@mixin([CallbackBase, CallbackGame])
export class CallbackGameCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'callback_game' as const;
}
export interface CallbackGameCallbackEvent extends CallbackBase, CallbackGame {}
@mixin([ShippingQuery])
export class ShippingQueryCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'shipping_query' as const;
}
export interface ShippingQueryCallbackEvent extends ShippingQuery {}

@mixin([PreCheckoutQuery])
export class PreCheckoutQueryCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'pre_checkout_query' as const;
}
export interface PreCheckoutQueryCallbackEvent extends PreCheckoutQuery {}

@mixin([Poll, PollChange])
export class PollChangeCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'poll_change' as const;
}
export interface PollChangeCallbackEvent extends PollChange, Poll {}
@mixin([PollAnswer])
export class PollAnswerChangeCallbackEvent extends EventBase {
  kind = 'callback' as const;
  type = 'poll_answer_change' as const;
}
export interface PollAnswerChangeCallbackEvent extends PollAnswer {}

@mixin([MyChatMember, ChatMemberUpdated])
export class BotMemberUpdatedActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'bot_member_updated' as const;
}
export interface BotMemberUpdatedActionEvent
  extends MyChatMember,
    ChatMemberUpdated {}

@mixin([ChatMember, ChatMemberUpdated])
export class ChatMemberUpdatedActionEvent extends EventBase {
  kind = 'action' as const;
  type = 'chat_member_updated' as const;
}
export interface ChatMemberUpdatedActionEvent
  extends ChatMember,
    ChatMemberUpdated {}

@mixin([Unknown])
export class UnknownEvent extends EventBase {
  kind = 'unknown' as const;
  type = 'unknown' as const;
}
export interface UnknownEvent extends Unknown {}

export type TelegramEvent =
  | TextMessageEvent
  | EditTextMessageEvent
  | TextChannelPostEvent
  | EditTextChannelPostEvent
  | AnimationMessageEvent
  | EditAnimationMessageEvent
  | AnimationChannelPostEvent
  | EditAnimationChannelPostEvent
  | AudioMessageEvent
  | EditAudioMessageEvent
  | AudioChannelPostEvent
  | EditAudioChannelPostEvent
  | DocumentMessageEvent
  | EditDocumentMessageEvent
  | DocumentChannelPostEvent
  | EditDocumentChannelPostEvent
  | PhotoMessageEvent
  | EditPhotoMessageEvent
  | PhotoChannelPostEvent
  | EditPhotoChannelPostEvent
  | StickerMessageEvent
  | EditStickerMessageEvent
  | StickerChannelPostEvent
  | EditStickerChannelPostEvent
  | VideoMessageEvent
  | EditVideoMessageEvent
  | VideoChannelPostEvent
  | EditVideoChannelPostEvent
  | VideoNoteMessageEvent
  | VideoNoteChannelPostEvent
  | VoiceMessageEvent
  | EditVoiceMessageEvent
  | VoiceChannelPostEvent
  | EditVoiceChannelPostEvent
  | ContactMessageEvent
  | ContactChannelPostEvent
  | DiceMessageEvent
  | DiceChannelPostEvent
  | GameMessageEvent
  | EditGameMessageEvent
  | PollMessageEvent
  | PollChannelPostEvent
  | VenueMessageEvent
  | VenueChannelPostEvent
  | LocationMessageEvent
  | LocationChannelPostEvent
  | NewChatMembersActionEvent
  | LeftChatMemberActionEvent
  | NewChatTitleActionEvent
  | NewChatPhotoActionEvent
  | DeleteChatPhotoActionEvent
  | CreateGroupChatActionEvent
  | MigrateToChatActionEvent
  | MigrateFromChatActionEvent
  | PinMessageActionEvent
  | SuccessfulPaymentCallbackEvent
  | InlineQueryCallbackEvent
  | ChooseInlineResultCallbackEvent
  | CallbackQueryCallbackEvent
  | CallbackGameCallbackEvent
  | ShippingQueryCallbackEvent
  | PreCheckoutQueryCallbackEvent
  | PollChangeCallbackEvent
  | PollAnswerChangeCallbackEvent
  | BotMemberUpdatedActionEvent
  | ChatMemberUpdatedActionEvent
  | UnknownEvent;
