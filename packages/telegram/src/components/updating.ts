import type { MachinatNode } from '@machinat/core/types';
import formatNode from '@machinat/core/utils/formatNode';
import { unitSegment } from '@machinat/core/renderer';
import type { UnitSegment, FunctionOf } from '@machinat/core/renderer/types';
import { annotateTelegramComponent } from '../utils';
import {
  TelegramSegmentValue,
  TelegramComponent,
  TelegramParseMode,
} from '../types';

type EditMessageProps = {
  /** Required if inlineMessageId is not specified. Identifier of the message to edit */
  messageId?: number;
  /** Required if messageId are not specified. Identifier of the inline message */
  inlineMessageId?: string;
  /** One {@link ReplyMarkup} element for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  replyMarkup?: MachinatNode;
};

/**
 * @category Props
 */
type EditTextProps = EditMessageProps & {
  /** Texual content for the new text of the message, 1-4096 characters after entities parsing */
  children: MachinatNode;
  /** Mode for parsing entities in the message text. See formatting options for more details. */
  parseMode?: TelegramParseMode;
  /** Disables link previews for links in this message */
  disableWebPagePreview?: boolean;
};

/** @ignore */
const __EditText: FunctionOf<TelegramComponent<
  EditTextProps,
  UnitSegment<TelegramSegmentValue>
>> = async function EditText(node, path, render) {
  const {
    children,
    messageId,
    inlineMessageId,
    parseMode = 'HTML',
    disableWebPagePreview,
    replyMarkup,
  } = node.props;

  const textSegments = await render(children, '.children');
  if (textSegments === null) {
    return null;
  }

  for (const segment of textSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-texual element ${formatNode(segment.node)} received in <EditText/>`
      );
    }
  }

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    unitSegment(node, path, {
      method: 'editMessageText',
      toDirectInstance: !!inlineMessageId,
      parameters: {
        text: textSegments[0].value,
        message_id: messageId,
        inline_message_id: inlineMessageId,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_web_page_preview: disableWebPagePreview,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Edit a text and game message
 * @category Component
 * @props {@link EditTextProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#editmessagetext).
 */
export const EditText: TelegramComponent<
  EditTextProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__EditText);

/**
 * @category Props
 */
type EditCaptionProps = EditMessageProps & {
  /** Texual content for the new caption of the message, 1-1024 characters after entities parsing */
  children: MachinatNode;
  /** Mode for parsing entities in the message text. See formatting options for more details. */
  parseMode: TelegramParseMode;
};

/** @ignore */
const __EditCaption: FunctionOf<TelegramComponent<
  EditCaptionProps,
  UnitSegment<TelegramSegmentValue>
>> = async function EditCaption(node, path, render) {
  const {
    children,
    messageId,
    inlineMessageId,
    parseMode = 'HTML',
    replyMarkup,
  } = node.props;

  const textSegments = await render(children, '.children');
  if (textSegments === null) {
    return null;
  }

  for (const segment of textSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-texual element ${formatNode(
          segment.node
        )} received in <EditCaption/>`
      );
    }
  }

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    unitSegment(node, path, {
      method: 'editMessageCaption',
      toDirectInstance: !!inlineMessageId,
      parameters: {
        caption: textSegments[0].value,
        message_id: messageId,
        inline_message_id: inlineMessageId,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Edit captions of a media messages
 * @category Component
 * @props {@link EditCaptionProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#editmssagecaption).
 */
export const EditCaption: TelegramComponent<
  EditCaptionProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__EditCaption);

/**
 * @category Props
 */
type EditMediaProps = EditMessageProps & {
  /**
   * An {@link Animation}, {@link Audio}, {@link Document}, {@link Photo} or
   * {@link Video} element as the new media of the message. Please note that the
   * {@link MessageProps} of the children are ignored.
   */
  children: MachinatNode;
};

/** @ignore */
const __EditMedia: FunctionOf<TelegramComponent<
  EditMediaProps,
  UnitSegment<TelegramSegmentValue>
>> = async function EditMedia(node, path, render) {
  const { children, messageId, inlineMessageId, replyMarkup } = node.props;

  const mediaSegments = await render(children, '.children');
  if (mediaSegments === null) {
    return null;
  }

  const {
    method,
    parameters,
    uploadingFiles,
  }: TelegramSegmentValue = mediaSegments[0].value;
  let mediaInput;

  if (method === 'sendPhoto') {
    mediaInput = {
      type: 'photo',
      media: parameters.photo,
      caption: parameters.caption,
      parse_mode: parameters.parse_mode,
    };
  } else if (method === 'sendVideo') {
    mediaInput = {
      type: 'video',
      media: parameters.video,
      caption: parameters.caption,
      parse_mode: parameters.parse_mode,
      thumb: parameters.thumb,
      duration: parameters.duration,
      width: parameters.width,
      height: parameters.height,
      supports_streaming: parameters.supports_streaming,
    };
  } else if (method === 'sendAnimation') {
    mediaInput = {
      type: 'animation',
      media: parameters.animation,
      caption: parameters.caption,
      parse_mode: parameters.parse_mode,
      thumb: parameters.thumb,
      duration: parameters.duration,
      width: parameters.width,
      height: parameters.height,
    };
  } else if (method === 'sendAudio') {
    mediaInput = {
      type: 'audio',
      media: parameters.audio,
      caption: parameters.caption,
      parse_mode: parameters.parse_mode,
      thumb: parameters.thumb,
      duration: parameters.duration,
      performer: parameters.performer,
      title: parameters.title,
    };
  } else if (method === 'sendDocument') {
    mediaInput = {
      type: 'document',
      media: parameters.document,
      caption: parameters.caption,
      parse_mode: parameters.parse_mode,
      thumb: parameters.thumb,
    };
  }

  if (uploadingFiles) {
    for (const { fieldName } of uploadingFiles) {
      if (fieldName === 'thumb') {
        mediaInput.thumb = 'attach://thumb';
      } else {
        mediaInput.media = `attach://${fieldName}`;
      }
    }
  }

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    unitSegment(node, path, {
      method: 'editMessageMedia',
      toDirectInstance: !!inlineMessageId,
      parameters: {
        media: mediaInput,
        message_id: messageId,
        inline_message_id: inlineMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      uploadingFiles,
    }),
  ];
};
/**
 * Edit a animation, audio, document, photo, or video messages. If a message is a part of a message album, then it can be edited only to a photo or a video. Otherwise, message type can be changed arbitrarily. When inline message is edited, new file can't be uploaded. Use previously uploaded file via its file_id or specify a URL.
 * @category Component
 * @props {@link EditMediaProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#editmessagemedia).
 */
export const EditMedia: TelegramComponent<
  EditMediaProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__EditMedia);

/**
 * @category Props
 */
type StopPollProps = {
  /**  	Identifier of the original message with the poll */
  messageId: number;
  /** One {@link ReplyMarkup} element for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  replyMarkup?: MachinatNode;
};

/** @ignore */
const __StopPoll: FunctionOf<TelegramComponent<
  StopPollProps,
  UnitSegment<TelegramSegmentValue>
>> = async function StopPoll(node, path, render) {
  const { messageId, replyMarkup } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    unitSegment(node, path, {
      method: 'stopPoll',
      parameters: {
        message_id: messageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
};
/**
 * Edit a text and game message
 * @category Component
 * @props {@link StopPollProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#stoppoll).
 */
export const StopPoll: TelegramComponent<
  StopPollProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__StopPoll);

/**
 * @category Props
 */
type DeleteMessageProps = {
  /**	Identifier of the original message with the poll */
  messageId: number;
};

/** @ignore */
const __DeleteMessage: FunctionOf<TelegramComponent<
  DeleteMessageProps,
  UnitSegment<TelegramSegmentValue>
>> = function DeleteMessage(node, path) {
  const { messageId } = node.props;

  return [
    unitSegment(node, path, {
      method: 'deleteMessage',
      parameters: {
        message_id: messageId,
      },
    }),
  ];
};
/**
 * Edit a text and game message
 * @category Component
 * @props {@link DeleteMessageProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#deletemessage).
 */
export const DeleteMessage: TelegramComponent<
  DeleteMessageProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__DeleteMessage);
