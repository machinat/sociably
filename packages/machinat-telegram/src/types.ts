/* eslint-disable camelcase */
import {
  PlatformMounter,
  EventContext,
  EventMiddleware,
  DispatchFrame,
  DispatchMiddleware,
} from '@machinat/core/types';
import { WebhookMetadata } from '@machinat/http/webhook/types';
import { TelegramEvent } from './event/types';
import TelegramChat from './channel';

// TODO: detailed raw types
export type RawMessage = any;
export type RawInlineQuery = any;
export type RawChosenInlineResult = any;
export type RawCallbackQuery = any;
export type RawShippingQuery = any;
export type RawPreCheckoutQuery = any;
export type RawPoll = any;
export type RawPollAnswer = any;
export type RawFile = any;
export type RawPhotoSize = any;
export type RawAnimation = any;
export type RawAudio = any;
export type RawVideo = any;
export type RawVideoNote = any;
export type RawVoice = any;
export type RawDocument = any;
export type RawSticker = any;
export type RawContact = any;
export type RawGame = any;
export type RawDice = any;
export type RawPollOption = any;
export type RawLocation = any;
export type RawVenue = any;
export type RawInvoice = any;
export type RawMessageEntity = any;
export type RawMaskPosition = any;
export type RawPassportData = any;
export type RawInlineKeyboardMarkup = any;
export type RawSuccessfulPayment = any;
export type RawShippingAddress = any;
export type RawOrderInfo = any;

export type TelegramChatType = 'private' | 'group' | 'supergroup' | 'channel';

export type RawUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type RawChat = {
  id: number;
  type: TelegramChatType;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramRawEvent = {
  /** The update's unique identifier. Update identifiers start from a certain positive number and increase sequentially. This ID becomes especially handy if you're using Webhooks, since it allows you to ignore repeated updates or to restore the correct update sequence, should they get out of order. If there are no new updates for at least a week, then identifier of the next update will be chosen randomly instead of sequentially. */
  update_id: number;
  /** New incoming message of any kind — text, photo, sticker, etc. */
  message?: RawMessage;
  /** New version of a message that is known to the bot and was edited */
  edited_message?: RawMessage;
  /** New incoming channel post of any kind — text, photo, sticker, etc. */
  channel_post?: RawMessage;
  /** New version of a channel post that is known to the bot and was edited */
  edited_channel_post?: RawMessage;
  /** New incoming inline query */
  inline_query?: RawInlineQuery;
  /**	 The result of an inline query that was chosen by a user and sent to their chat partner. Please see our documentation on the feedback collecting for details on how to enable these updates for your bot. */
  chosen_inline_result?: RawChosenInlineResult;
  /** New incoming callback query */
  callback_query?: RawCallbackQuery;
  /** New incoming shipping query. Only for invoices with flexible price */
  shipping_query?: RawShippingQuery;
  /** New incoming pre-checkout query. Contains full information about checkout */
  pre_checkout_query?: RawPreCheckoutQuery;
  /** New poll state. Bots receive only updates about stopped polls and polls, which are sent by the bot */
  poll?: RawPoll;
  /** A user changed their answer in a non-anonymous poll. Bots receive new votes only in polls that were sent by the bot itself. */
  poll_answer?: RawPollAnswer;
};

export type TelegramPlatformConfigs = {
  webhookPath?: string;
  secretPath?: string;
  botToken: string;
};

export type TelegramJob = {
  method: string;
  parameters: { [k: string]: any };
  executionKey: undefined | string;
};

export type TelegramEventContext = EventContext<
  TelegramEvent,
  WebhookMetadata,
  TelegramBot
>;

export type TelegramEventMiddleware = EventMiddleware<
  TelegramEventContext,
  null
>;

export type TelegramDispatchFrame = DispatchFrame<
  TelegramChat,
  TelegramJob,
  TelegramBot
>;

export type TelegramAPIResult = any;

export type TelegramDispatchMiddleware = DispatchMiddleware<
  TelegramJob,
  TelegramDispatchFrame,
  TelegramAPIResult
>;

export type TelegramPlatformMounter = PlatformMounter<
  TelegramEventContext,
  null,
  TelegramJob,
  TelegramDispatchFrame,
  TelegramAPIResult
>;
