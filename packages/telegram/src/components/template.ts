import type { MachinatNode } from '@machinat/core/types';
import formatNode from '@machinat/core/utils/formatNode';
import { makeUnitSegment } from '@machinat/core/renderer';
import type { UnitSegment, FunctionOf } from '@machinat/core/renderer/types';
import { annotateTelegramComponent } from '../utils';
import {
  TelegramSegmentValue,
  TelegramComponent,
  TelegramParseMode,
} from '../types';
import { MessageProps } from './types';

/**
 * @category Props
 */
export interface TextProps extends MessageProps {
  /** Texual content of the message to be sent, 1-4096 characters after entities parsing */
  children: MachinatNode;
  /** Mode for parsing entities in the message text. See formatting options for more details. */
  parseMode?: TelegramParseMode;
  /** Disables link previews for links in this message */
  disableWebPagePreview?: boolean;
}

/** @ignore */
const __Text: FunctionOf<TelegramComponent<
  TextProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Text(node, path, render) {
  const {
    children,
    parseMode = 'HTML',
    disableWebPagePreview,
    disableNotification,
    replyToMessageId,
    replyMarkup,
  } = node.props;

  const textSegments = await render(children, '.children');
  if (textSegments === null) {
    return null;
  }

  for (const segment of textSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-texual element ${formatNode(segment.node)} received in <Text/>`
      );
    }
  }

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'sendMessage',
      parameters: {
        text: textSegments[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_web_page_preview: disableWebPagePreview,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Send a location point on the map.
 * @category Component
 * @props {@link TextProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendmessage).
 */
export const Text: TelegramComponent<
  TextProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Text);

/**
 * @category Props
 */
export interface ContactProps extends MessageProps {
  /** Contact's phone number */
  phoneNumber: string;
  /** Contact's first name */
  firstName: string;
  /** Contact's last name */
  lastName?: string;
  /** Additional data about the contact in the form of a vCard, 0-2048 bytes */
  vcard?: string;
}

/** @ignore */
const __Contact: FunctionOf<TelegramComponent<
  ContactProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Contact(node, path, render) {
  const {
    phoneNumber,
    firstName,
    lastName,
    vcard,
    disableNotification,
    replyToMessageId,
    replyMarkup,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'sendContact',
      parameters: {
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName,
        vcard,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Send a location point on the map.
 * @category Component
 * @props {@link ContactProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendcontact).
 */
export const Contact: TelegramComponent<
  ContactProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Contact);

/**
 * @category Props
 */
export interface PollProps extends MessageProps {
  /** Poll question, 1-255 characters */
  question: string;
  /** A JSON-serialized list of answer options, 2-10 strings 1-100 characters each */
  options: string[];
  /** True, if the poll needs to be anonymous, defaults to True */
  isAnonymous?: boolean;
  /** Poll type, “quiz” or “regular”, defaults to “regular” */
  type?: 'quiz' | 'regular';
  /** True, if the poll allows multiple answers, ignored for polls in quiz mode, defaults to False */
  allowsMultipleAnswers?: boolean;
  /** 0-based identifier of the correct answer option, required for polls in quiz mode */
  correctOptionId?: number;
  /** Textual node that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters with at most 2 line feeds after entities parsing */
  explanation?: MachinatNode;
  /** Mode for parsing entities in the explanation. */
  explanationParseMode?: TelegramParseMode;
  /** Amount of time in seconds the poll will be active after creation, 5-600. Can't be used together with closeDate. */
  openPeriod?: number;
  /** Point in time (Unix timestamp) when the poll will be automatically closed. Must be at least 5 and no more than 600 seconds in the future. Can't be used together with openPeriod. */
  closeDate?: number | Date;
  /** Pass True, if the poll needs to be immediately closed. This can be useful for poll preview. */
  isClosed?: boolean;
}

/** @ignore */
const __Poll: FunctionOf<TelegramComponent<
  PollProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Poll(node, path, render) {
  const {
    question,
    options,
    isAnonymous,
    type,
    allowsMultipleAnswers,
    correctOptionId,
    explanation,
    explanationParseMode = 'HTML',
    openPeriod,
    closeDate,
    isClosed,
    disableNotification,
    replyToMessageId,
    replyMarkup,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const explanationSegments = await render(explanation, '.explanation');
  return [
    makeUnitSegment(node, path, {
      method: 'sendPoll',
      parameters: {
        question,
        options,
        is_anonymous: isAnonymous,
        type,
        allows_multiple_answers: allowsMultipleAnswers,
        correct_option_id: correctOptionId,
        explanation: explanationSegments?.[0].value,
        explanation_parse_mode:
          explanationParseMode === 'None' ? undefined : explanationParseMode,
        open_period: openPeriod,
        close_date:
          closeDate instanceof Date
            ? Math.round(closeDate.getTime() / 1000)
            : closeDate,
        is_closed: isClosed,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Send a location point on the map.
 * @category Component
 * @props {@link PollProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendpoll).
 */
export const Poll: TelegramComponent<
  PollProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Poll);

/**
 * @category Props
 */
export interface DiceProps extends MessageProps {
  /** Emoji on which the dice throw animation is based. Currently, must be one of “🎲”, “🎯”, or “🏀”. Dice can have values 1-6 for “🎲” and “🎯”, and values 1-5 for “🏀”. Defaults to “🎲” */
  emoji?: string;
}

/** @ignore */
const __Dice: FunctionOf<TelegramComponent<
  DiceProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Dice(node, path, render) {
  const {
    emoji,
    disableNotification,
    replyToMessageId,
    replyMarkup,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'sendDice',
      parameters: {
        emoji,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Send a location point on the map.
 * @category Component
 * @props {@link DiceProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#senddice).
 */
export const Dice: TelegramComponent<
  DiceProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Dice);

/**
 * @category Props
 */
export interface InvoiceProps extends MessageProps {
  /** Product name, 1-32 characters */
  title: string;
  /** Product description, 1-255 characters */
  description: string;
  /** Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes. */
  payload: string;
  /** Payments provider token, obtained via Botfather */
  providerToken: string;
  /** Unique deep-linking parameter that can be used to generate this invoice when used as a start parameter */
  startParameter: string;
  /** Three-letter ISO 4217 currency code, see more on currencies */
  currency: string;
  /** Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.) */
  prices: { label: string; amount: number }[];
  /** A JSON-serialized data about the invoice, which will be shared with the payment provider. A detailed description of required fields should be provided by the payment provider. */
  providerData?: string | object; // eslint-disable-line @typescript-eslint/ban-types
  /** URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. People like it better when they see what they are paying for. */
  photoUrl?: string;
  /** Photo size */
  photoSize?: number;
  /** Photo width */
  photoWidth?: number;
  /** Photo height */
  photoHeight?: number;
  /** Pass True, if you require the user's full name to complete the order */
  needName?: boolean;
  /** Pass True, if you require the user's phone number to complete the order */
  needPhoneNumber?: boolean;
  /** Pass True, if you require the user's email address to complete the order */
  needEmail?: boolean;
  /** Pass True, if you require the user's shipping address to complete the order */
  needShippingAddress?: boolean;
  /** Pass True, if user's phone number should be sent to provider */
  sendPhoneNumberToProvider?: boolean;
  /** Pass True, if user's email address should be sent to provider */
  sendEmailToProvider?: boolean;
  /** Pass True, if the final price depends on the shipping method */
  isFlexible?: boolean;
}

/** @ignore */
const __Invoice: FunctionOf<TelegramComponent<
  InvoiceProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Invoice(node, path, render) {
  const {
    title,
    description,
    payload,
    providerToken,
    startParameter,
    currency,
    prices,
    providerData,
    photoUrl,
    photoSize,
    photoWidth,
    photoHeight,
    needName,
    needPhoneNumber,
    needEmail,
    needShippingAddress,
    sendPhoneNumberToProvider,
    sendEmailToProvider,
    isFlexible,
    disableNotification,
    replyToMessageId,
    replyMarkup,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'sendInvoice',
      parameters: {
        title,
        description,
        payload,
        provider_token: providerToken,
        start_parameter: startParameter,
        currency,
        prices,
        provider_data: providerData,
        photo_url: photoUrl,
        photo_size: photoSize,
        photo_width: photoWidth,
        photo_height: photoHeight,
        need_name: needName,
        need_phone_number: needPhoneNumber,
        need_email: needEmail,
        need_shipping_address: needShippingAddress,
        send_phone_number_to_provider: sendPhoneNumberToProvider,
        send_email_to_provider: sendEmailToProvider,
        is_flexible: isFlexible,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Send a location point on the map.
 * @category Component
 * @props {@link InvoiceProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendinvoice).
 */
export const Invoice: TelegramComponent<
  InvoiceProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Invoice);

/**
 * @category Props
 */
export interface GameProps extends MessageProps {
  /** Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather. */
  gameShortName: string;
}

/** @ignore */
const __Game: FunctionOf<TelegramComponent<
  GameProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Game(node, path, render) {
  const {
    gameShortName,
    disableNotification,
    replyToMessageId,
    replyMarkup,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'sendGame',
      parameters: {
        game_short_name: gameShortName,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Send a location point on the map.
 * @category Component
 * @props {@link GameProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendgame).
 */
export const Game: TelegramComponent<
  GameProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Game);
