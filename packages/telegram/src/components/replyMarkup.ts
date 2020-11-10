import { MachinatNode } from '@machinat/core/types';
import { partSegment } from '@machinat/core/renderer';
import type { PartSegment, FunctionOf } from '@machinat/core/renderer/types';
import { annotateTelegramComponent } from '../utils';
import type { TelegramComponent } from '../types';

/**
 * @category Props
 */
type URLButtonProps = {
  /** Label text on the button. */
  text: string;
  /** HTTP or tg:// url to be opened. */
  url: string;
  /** If set to true, Telegram will automatically authorize the user. */
  login?: boolean;
  /** Login mode only. New text of the button in forwarded messages. */
  forwardText?: string;
  /** Login mode only. Username of a bot, which will be used for user authorization. If not specified, the current bot's username will be assumed. The url's domain must be the same as the domain linked with the bot. */
  botUserName?: string;
  /** Login mode only. Pass True to request the permission for your bot to send messages to the user. */
  requestWriteAccess?: boolean;
};

/** @ignore */
const __URLButton: FunctionOf<TelegramComponent<
  URLButtonProps,
  PartSegment<any>
>> = function URLButton(node, path) {
  const {
    text,
    url,
    login,
    forwardText,
    botUserName,
    requestWriteAccess,
  } = node.props;

  return [
    partSegment(
      node,
      path,
      login
        ? {
            text,
            login_url: {
              url,
              forward_text: forwardText,
              bot_username: botUserName,
              request_write_access: requestWriteAccess,
            },
          }
        : { text, url }
    ),
  ];
};
/**
 * The url will be opened by the client when button is pressed. If `login` is
 * set, the authorization data will be provided within querystrings. The `login`
 * mode is an easier replacement for the Telegram Login Widget.
 * @category Component
 * @props {@link URLButtonProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinekeyboardbutton).
 */
export const URLButton: TelegramComponent<
  URLButtonProps,
  PartSegment<any>
> = annotateTelegramComponent(__URLButton);

/**
 * @category Props
 */
type CallbackButtonProps = {
  /** Label text on the button. */
  text: string;
  /** Data to be sent in a callback query, 1-64 bytes */
  data: string;
};

/** @ignore */
const __CallbackButton: FunctionOf<TelegramComponent<
  CallbackButtonProps,
  PartSegment<any>
>> = function CallbackButton(node, path) {
  const { text, data } = node.props;

  return [partSegment(node, path, { text, callback_data: data })];
};
/**
 * A {@link CallbackQueryEvent} will be triggered when button is pressed.
 * @category Component
 * @props {@link CallbackButtonProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinekeyboardbutton).
 */
export const CallbackButton: TelegramComponent<
  CallbackButtonProps,
  PartSegment<any>
> = annotateTelegramComponent(__CallbackButton);

/**
 * @category Props
 */
type SwitchInlineQueryButtonProps = {
  /** Label text on the button. */
  text: string;
  /** The inline query to be inserted in the input field after the bot's username. Default to empty string. */
  query?: string;
  /** If set to true, the query will be inserted in the current chat's input field. Default to false. */
  currentChat?: boolean;
};

/** @ignore */
const __SwitchInlineQueryButton: FunctionOf<TelegramComponent<
  SwitchInlineQueryButtonProps,
  PartSegment<any>
>> = function SwitchInlineQueryButton(node, path) {
  const { text, query, currentChat } = node.props;

  return [
    partSegment(
      node,
      path,
      currentChat
        ? { text, switch_inline_query_current_chat: query || '' }
        : { text, switch_inline_query: query || '' }
    ),
  ];
};
/**
 * Pressing the button will prompt the user to select one of their chats, open
 * that chat and insert the bot's username and the specified inline query in the
 * input field.
 * @category Component
 * @props {@link SwitchInlineQueryButtonProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinekeyboardbutton).
 */
export const SwitchInlineQueryButton: TelegramComponent<
  SwitchInlineQueryButtonProps,
  PartSegment<any>
> = annotateTelegramComponent(__SwitchInlineQueryButton);

/**
 * @category Props
 */
type CallbackGameButtonProps = {
  /** Label text on the button. */
  text: string;
};

/** @ignore */
const __CallbackGameButton: FunctionOf<TelegramComponent<
  CallbackGameButtonProps,
  PartSegment<any>
>> = function CallbackGameButton(node, path) {
  const { text } = node.props;
  return [
    partSegment(node, path, {
      text,
      callback_game: {},
    }),
  ];
};
/**
 * Description of the game that will be launched when the user presses the button. This type of button must always be the **first button** in the first row.
 * @category Component
 * @props {@link CallbackGameButtonProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinekeyboardbutton).
 */
export const CallbackGameButton: TelegramComponent<
  CallbackGameButtonProps,
  PartSegment<any>
> = annotateTelegramComponent(__CallbackGameButton);

/**
 * @category Props
 */
type PayButtonProps = {
  /** Label text on the button. */
  text: string;
};
/** @ignore */
const __PayButton: FunctionOf<TelegramComponent<
  PayButtonProps,
  PartSegment<any>
>> = function PayButton(node, path) {
  const { text } = node.props;
  return [
    partSegment(node, path, {
      text,
      pay: true,
    }),
  ];
};
/**
 * Description of the game that will be launched when the user presses the button. This type of button must always be the **first button** in the first row.
 * @category Component
 * @props {@link PayButtonProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinekeyboardbutton).
 */
export const PayButton: TelegramComponent<
  PayButtonProps,
  PartSegment<any>
> = annotateTelegramComponent(__PayButton);

export type InlineButton =
  | typeof URLButton
  | typeof CallbackButton
  | typeof CallbackGameButton
  | typeof SwitchInlineQueryButton
  | typeof PayButton;

/**
 * @category Props
 */
type KeyboardRowProps = {
  /**	Button elements contained by the row. */
  children: MachinatNode;
};
/** @ignore */
const __KeyboardRow: FunctionOf<TelegramComponent<
  KeyboardRowProps,
  PartSegment<any>
>> = async function KeyboardRow(node, path, render) {
  const { children } = node.props;
  const buttonsSegments = await render(children, '.children');

  if (!buttonsSegments) {
    return null;
  }

  return [
    partSegment(
      node,
      path,
      buttonsSegments.map(({ value }) => value)
    ),
  ];
};
/**
 * Represent a row of buttons within {@link InlineKeyboard} or {@link ReplyKeyboard}.
 * @category Component
 * @props {@link KeyboardRowProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#replykeyboardmarkup).
 */
export const KeyboardRow: TelegramComponent<
  KeyboardRowProps,
  PartSegment<any>
> = annotateTelegramComponent(__KeyboardRow);

/**
 * @category Props
 */
type InlineKeyboardProps = {
  /**
   * {@link InlineButton} elements within the keyboard. By default a button take
   * a row, wrap the buttons with {@link KeyboardRow} to display multiple
   * buttons in a row.
   */
  children: MachinatNode;
};
/** @ignore */
const __InlineKeyboard: FunctionOf<TelegramComponent<
  InlineKeyboardProps,
  PartSegment<any>
>> = async function InlineKeyboard(node, path, render) {
  const { children } = node.props;
  const buttonsSegments = await render(children, '.children');

  if (!buttonsSegments) {
    return null;
  }

  return [
    partSegment(node, path, {
      inline_keyboard: buttonsSegments.map(({ value }) =>
        Array.isArray(value) ? value : [value]
      ),
    }),
  ];
};
/**
 *
 * @category Component
 * @props {@link InlineKeyboardProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinekeyboardbutton).
 */
export const InlineKeyboard: TelegramComponent<
  InlineKeyboardProps,
  PartSegment<any>
> = annotateTelegramComponent(__InlineKeyboard);

/**
 * @category Props
 */
type ReplyButtonProps = {
  /**	Text of the button. If none of the optional fields are used, it will be sent as a message when the button is pressed */
  text: string;
  /** If True, the user's phone number will be sent as a contact when the button is pressed. Available in private chats only */
  requestContact?: boolean;
  /** If True, the user's current location will be sent when the button is pressed. Available in private chats only */
  requestLocation?: boolean;
  /** If specified, the user will be asked to create a poll and send it to the bot when the button is pressed. Available in private chats only */
  requestPoll?: boolean | 'regular' | 'quiz';
};
/** @ignore */
const __ReplyButton: FunctionOf<TelegramComponent<
  ReplyButtonProps,
  PartSegment<any>
>> = function ReplyButton(node, path) {
  const { text, requestContact, requestLocation, requestPoll } = node.props;

  return [
    partSegment(node, path, {
      text,
      request_contact: requestContact,
      request_location: requestLocation,
      request_poll: requestPoll
        ? { type: typeof requestPoll === 'string' ? requestPoll : undefined }
        : undefined,
    }),
  ];
};
/**
 * Button of the {@link ReplyKeyboard}.
 * @category Component
 * @props {@link ReplyButtonProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#keyboardbutton).
 */
export const ReplyButton: TelegramComponent<
  ReplyButtonProps,
  PartSegment<any>
> = annotateTelegramComponent(__ReplyButton);

/**
 * @category Props
 */
type ReplyKeyboardProps = {
  /**
   * {@link ReplyButton} elements within the keyboard. By default a button take
   * a row, wrap the buttons with {@link KeyboardRow} to display multiple
   * buttons in a row.
   */
  children: MachinatNode;
  /** Requests clients to resize the keyboard vertically for optimal fit (e.g., make the keyboard smaller if there are just two rows of buttons). Defaults to false, in which case the custom keyboard is always of the same height as the app's standard keyboard. */
  resizeKeyboard?: boolean;
  /** Requests clients to hide the keyboard as soon as it's been used. The keyboard will still be available, but clients will automatically display the usual letter-keyboard in the chat – the user can press a special button in the input field to see the custom keyboard again. Defaults to false. */
  oneTimeKeyboard?: boolean;
  /** Use this parameter if you want to show the keyboard to specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message. */
  selective?: boolean;
};
/** @ignore */
const __ReplyKeyboard: FunctionOf<TelegramComponent<
  ReplyKeyboardProps,
  PartSegment<any>
>> = async function ReplyKeyboard(node, path, render) {
  const { children, resizeKeyboard, oneTimeKeyboard, selective } = node.props;
  const rowsSegments = await render(children, '.children');

  if (!rowsSegments) {
    return null;
  }

  return [
    partSegment(node, path, {
      keyboard: rowsSegments.map(({ value }) =>
        Array.isArray(value) ? value : [value]
      ),
      resize_keyboard: resizeKeyboard,
      one_time_keyboard: oneTimeKeyboard,
      selective,
    }),
  ];
};
/**
 *
 * @category Component
 * @props {@link ReplyKeyboardProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#replykeyboardmarkup).
 */
export const ReplyKeyboard: TelegramComponent<
  ReplyKeyboardProps,
  PartSegment<any>
> = annotateTelegramComponent(__ReplyKeyboard);

/**
 * @category Props
 */
type RemoveReplyKeyboardProps = {
  /**	Use this parameter if you want to remove the keyboard for specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message. */
  selective?: boolean;
};
/** @ignore */
const __RemoveReplyKeyboard: FunctionOf<TelegramComponent<
  RemoveReplyKeyboardProps,
  PartSegment<any>
>> = function RemoveReplyKeyboard(node, path) {
  const { selective } = node.props;
  return [partSegment(node, path, { remove_keyboard: true, selective })];
};
/**
 * Requests clients to remove the custom keyboard (user will not be able to summon this keyboard; if you want to hide the keyboard from sight but keep it accessible, use `oneTimeBeyboard` in {@link ReplyKeyboard})
 * @category Component
 * @props {@link RemoveReplyKeyboardProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#replykeyboardremove).
 */
export const RemoveReplyKeyboard: TelegramComponent<
  RemoveReplyKeyboardProps,
  PartSegment<any>
> = annotateTelegramComponent(__RemoveReplyKeyboard);

/**
 * @category Props
 */
type ForceReplyProps = {
  /**	Use this parameter if you want to remove the keyboard for specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message. */
  selective?: boolean;
};
/** @ignore */
const __ForceReply: FunctionOf<TelegramComponent<
  ForceReplyProps,
  PartSegment<any>
>> = function ForceReply(node, path) {
  const { selective } = node.props;
  return [partSegment(node, path, { force_reply: true, selective })];
};
/**
 * Requests clients to remove the custom keyboard (user will not be able to summon this keyboard; if you want to hide the keyboard from sight but keep it accessible, use `oneTimeBeyboard` in {@link ReplyKeyboard})
 * @category Component
 * @props {@link ForceReplyProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#replykeyboardremove).
 */
export const ForceReply: TelegramComponent<
  ForceReplyProps,
  PartSegment<any>
> = annotateTelegramComponent(__ForceReply);

export type ReplyMarkup =
  | typeof InlineKeyboard
  | typeof ReplyKeyboard
  | typeof RemoveReplyKeyboard
  | typeof ForceReply;
