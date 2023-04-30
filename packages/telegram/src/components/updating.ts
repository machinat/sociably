import type { SociablyNode } from '@sociably/core';
import { formatNode } from '@sociably/core/utils';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTelegramComponent from '../utils/makeTelegramComponent';
import {
  TelegramSegmentValue,
  TelegramComponent,
  TelegramParseMode,
} from '../types';

export interface EditMessageProps {
  /** Required if inlineMessageId is not specified. Identifier of the message to edit */
  messageId?: number;
  /** Required if messageId are not specified. Identifier of the inline message */
  inlineMessageId?: string;
  /** One {@link ReplyMarkup} element for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  replyMarkup?: SociablyNode;
}

/**
 * @category Props
 */
export interface EditTextProps extends EditMessageProps {
  /** Texual content for the new text of the message, 1-4096 characters after entities parsing */
  children: SociablyNode;
  /** Mode for parsing entities in the message text. See formatting options for more details. */
  parseMode?: TelegramParseMode;
  /** Disables link previews for links in this message */
  disableWebPagePreview?: boolean;
}

/**
 * Edit a text and game message
 * @category Component
 * @props {@link EditTextProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#editmessagetext).
 */
export const EditText: TelegramComponent<
  EditTextProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function EditText(node, path, render) {
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
    makeUnitSegment(node, path, {
      method: 'editMessageText',
      toNonChatTarget: !!inlineMessageId,
      params: {
        text: textSegments[0].value,
        message_id: messageId,
        inline_message_id: inlineMessageId,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_web_page_preview: disableWebPagePreview,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
});

/**
 * @category Props
 */
export interface EditCaptionProps extends EditMessageProps {
  /** Texual content for the new caption of the message, 1-1024 characters after entities parsing */
  children: SociablyNode;
  /** Mode for parsing entities in the message text. See formatting options for more details. */
  parseMode: TelegramParseMode;
}

/**
 * Edit captions of a media messages
 * @category Component
 * @props {@link EditCaptionProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#editmssagecaption).
 */
export const EditCaption: TelegramComponent<
  EditCaptionProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function EditCaption(node, path, render) {
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
    makeUnitSegment(node, path, {
      method: 'editMessageCaption',
      toNonChatTarget: !!inlineMessageId,
      params: {
        caption: textSegments[0].value,
        message_id: messageId,
        inline_message_id: inlineMessageId,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
});

/**
 * @category Props
 */
export interface EditMediaProps extends EditMessageProps {
  /**
   * An {@link Animation}, {@link Audio}, {@link Document}, {@link Photo} or
   * {@link Video} element as the new media of the message. Please note that the
   * {@link MessageProps} of the children are ignored.
   */
  children: SociablyNode;
}

/**
 * Edit a animation, audio, document, photo, or video messages. If a message is a part of a message album, then it can be edited only to a photo or a video. Otherwise, message type can be changed arbitrarily. When inline message is edited, new file can't be uploaded. Use previously uploaded file via its file_id or specify a URL.
 * @category Component
 * @props {@link EditMediaProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#editmessagemedia).
 */
export const EditMedia: TelegramComponent<
  EditMediaProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function EditMedia(node, path, render) {
  const { children, messageId, inlineMessageId, replyMarkup } = node.props;

  const mediaSegments = await render(children, '.children');
  if (mediaSegments === null) {
    return null;
  }

  const { method, params, uploadFiles }: TelegramSegmentValue =
    mediaSegments[0].value;
  let mediaInput;

  if (method === 'sendPhoto') {
    mediaInput = {
      type: 'photo',
      media: params.photo,
      caption: params.caption,
      parse_mode: params.parse_mode,
    };
  } else if (method === 'sendVideo') {
    mediaInput = {
      type: 'video',
      media: params.video,
      caption: params.caption,
      parse_mode: params.parse_mode,
      thumb: params.thumb,
      duration: params.duration,
      width: params.width,
      height: params.height,
      supports_streaming: params.supports_streaming,
    };
  } else if (method === 'sendAnimation') {
    mediaInput = {
      type: 'animation',
      media: params.animation,
      caption: params.caption,
      parse_mode: params.parse_mode,
      thumb: params.thumb,
      duration: params.duration,
      width: params.width,
      height: params.height,
    };
  } else if (method === 'sendAudio') {
    mediaInput = {
      type: 'audio',
      media: params.audio,
      caption: params.caption,
      parse_mode: params.parse_mode,
      thumb: params.thumb,
      duration: params.duration,
      performer: params.performer,
      title: params.title,
    };
  } else if (method === 'sendDocument') {
    mediaInput = {
      type: 'document',
      media: params.document,
      caption: params.caption,
      parse_mode: params.parse_mode,
      thumb: params.thumb,
    };
  }

  if (uploadFiles) {
    for (const { fieldName } of uploadFiles) {
      if (fieldName === 'thumb') {
        mediaInput.thumb = 'attach://thumb';
      } else {
        mediaInput.media = `attach://${fieldName}`;
      }
    }
  }

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'editMessageMedia',
      toNonChatTarget: !!inlineMessageId,
      params: {
        media: mediaInput,
        message_id: messageId,
        inline_message_id: inlineMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      uploadFiles,
    }),
  ];
});

/**
 * @category Props
 */
export interface StopPollProps {
  /**  	Identifier of the original message with the poll */
  messageId: number;
  /** One {@link ReplyMarkup} element for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  replyMarkup?: SociablyNode;
}

/**
 * Edit a text and game message
 * @category Component
 * @props {@link StopPollProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#stoppoll).
 */
export const StopPoll: TelegramComponent<
  StopPollProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function StopPoll(node, path, render) {
  const { messageId, replyMarkup } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    makeUnitSegment(node, path, {
      method: 'stopPoll',
      params: {
        message_id: messageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
    }),
  ];
});

/**
 * @category Props
 */
export interface DeleteMessageProps {
  /**	Identifier of the original message with the poll */
  messageId: number;
}

/**
 * Edit a text and game message
 * @category Component
 * @props {@link DeleteMessageProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#deletemessage).
 */
export const DeleteMessage: TelegramComponent<
  DeleteMessageProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function DeleteMessage(node, path) {
  const { messageId } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'deleteMessage',
      params: {
        message_id: messageId,
      },
    }),
  ];
});
