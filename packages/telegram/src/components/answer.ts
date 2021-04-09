import { MachinatNode } from '@machinat/core/types';
import { unitSegment, partSegment } from '@machinat/core/renderer';
import type { UnitSegment, PartSegment } from '@machinat/core/renderer/types';
import formatNode from '@machinat/core/utils/formatNode';
import { annotateTelegramComponent } from '../utils';
import {
  TelegramSegmentValue,
  TelegramComponent,
  TelegramParseMode,
} from '../types';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/**
 * @category Props
 */
export interface AnswerCallbackQueryProps {
  /** Unique identifier for the query to be answered */
  queryId: string;
  /** Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters */
  text?: string;
  /** If true, an alert will be shown by the client instead of a notification at the top of the chat screen. Defaults to false. */
  showAlert?: boolean;
  /** URL that will be opened by the user's client. If you have created a Game and accepted the conditions via @Botfather, specify the URL that opens your game — note that this will only work if the query comes from a callback_game button.   Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter. */
  url?: string;
  /** The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0. */
  cacheTime?: number;
}

/**
 * Send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert.
 * @category Component
 * @props {@link AnswerCallbackQueryProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#answercallbackquery).
 */
export const AnswerCallbackQuery: TelegramComponent<
  AnswerCallbackQueryProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(function AnswerCallbackQuery(node, path) {
  const { queryId, text, url, showAlert, cacheTime } = node.props;

  return [
    unitSegment<TelegramSegmentValue>(node, path, {
      method: 'answerCallbackQuery',
      toDirectInstance: true,
      parameters: {
        callback_query_id: queryId,
        text,
        url,
        show_alert: showAlert,
        cache_time: cacheTime,
      },
    }),
  ];
});

export interface InlineQueryResultProps {
  /** Unique identifier for this result, 1-64 bytes */
  id: string;
  /** One {@link InlineKeyboardMarkup} element attached to the message */
  replyMarkup?: MachinatNode;
  /** One {@link Text}, {@link Location}, {@link Venue} or {@link Contact} element as the replacement of message content to be sent */
  inputMessageContent?: MachinatNode;
}

const renderInputMessageContent = async (node, render) => {
  const segments = await render(node, '.inputMessageContent');
  if (!segments) {
    return undefined;
  }

  if (segments[0].type === 'text') {
    return {
      message_text: segments[0].value,
    };
  }

  const { method, parameters } = segments[0].value;

  if (method === 'sendMessage') {
    return {
      message_text: parameters.text,
      parse_mode: parameters.parse_mode,
      disable_web_page_preview: parameters.disable_web_page_preview,
    };
  }
  if (method === 'sendLocation') {
    return {
      latitude: parameters.latitude,
      longitude: parameters.longitude,
      live_period: parameters.live_period,
    };
  }
  if (method === 'sendVenue') {
    return {
      latitude: parameters.latitude,
      longitude: parameters.longitude,
      title: parameters.title,
      address: parameters.address,
      foursquare_id: parameters.foursquare_id,
      foursquare_type: parameters.foursquare_type,
    };
  }
  if (method === 'sendContact') {
    return {
      phone_number: parameters.phone_number,
      first_name: parameters.first_name,
      last_name: parameters.last_name,
      vcard: parameters.vcard,
    };
  }

  throw new TypeError(
    `invalid inputMessageContent ${formatNode(
      segments[0].node
    )} received, only <Text/>, <Location/>, <Venue/> or <Contact/> allowed`
  );
};

/**
 * @category Props
 */
type InlineQueryResultArticleProps = InlineQueryResultProps & {
  /** Title of the result */
  title: string;
  /** URL of the result */
  url?: string;
  /** Pass True, if you don't want the URL to be shown in the message */
  hideUrl?: boolean;
  /** Short description of the result */
  description?: string;
  /** URL of the thumbnail for the result */
  thumbUrl?: string;
  /** Thumbnail width */
  thumbWidth?: number;
  /** Thumbnail height */
  thumbHeight?: number;
};

/**
 * Represents a link to an article or web page.
 * @category Component
 * @props {@link InlineQueryResultArticleProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultarticle).
 */
export const InlineQueryResultArticle: TelegramComponent<
  InlineQueryResultArticleProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultArticle(
  node,
  path,
  render
) {
  const {
    id,
    replyMarkup,
    inputMessageContent,
    title,
    url,
    hideUrl,
    description,
    thumbUrl,
    thumbWidth,
    thumbHeight,
  } = node.props;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
  ]);

  return [
    partSegment(node, path, {
      type: 'article',
      id,
      title,
      url,
      hide_url: hideUrl,
      description,
      thumb_url: thumbUrl,
      thumb_width: thumbWidth,
      thumb_height: thumbHeight,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultPhotoProps = InlineQueryResultProps &
  (
    | // from URL
    {
        /** A valid URL of the photo. Photo must be in jpeg format. Photo size must not exceed 5MB */
        url: string;
        /** URL of the thumbnail for the photo */
        thumbUrl: string;
        /** Width of the photo */
        width?: number;
        /** Height of the photo */
        height?: number;
      }
    // from cached file
    | {
        /** The file id of photo stored on the Telegram servers */
        fileId: string;
      }
  ) & {
    /** Title for the result */
    title?: string;
    /** Short description of the result */
    description?: string;
    /** Texual node of the file caption, 0-1024 characters after entities parsing */
    caption?: MachinatNode;
    /** Mode for parsing entities of the. See formatting options for more details. */
    parseMode?: TelegramParseMode;
  };

/**
 * Represents a link to a photo. By default, this photo will be sent by the user with optional caption. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the photo.
 * @category Component
 * @props {@link InlineQueryResultPhotoProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultphoto).
 */
export const InlineQueryResultPhoto: TelegramComponent<
  InlineQueryResultPhotoProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultPhoto(
  node,
  path,
  render
) {
  const {
    id,
    title,
    fileId,
    url,
    width,
    height,
    description,
    thumbUrl,
    caption,
    parseMode = 'HTML',
    replyMarkup,
    inputMessageContent,
  } = node.props as UnionToIntersection<InlineQueryResultPhotoProps>;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
    captionSegments,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
    render(caption, '.caption'),
  ]);

  return [
    partSegment(node, path, {
      type: 'photo',
      id,
      photo_file_id: fileId,
      photo_url: url,
      photo_width: width,
      photo_height: height,
      title,
      description,
      caption: captionSegments?.[0].value,
      parse_mode: parseMode === 'None' ? undefined : parseMode,
      thumb_url: thumbUrl,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultGifProps = InlineQueryResultProps &
  (
    | // from URL
    {
        /** A valid URL of the GIF file. File size must not exceed 1MB */
        url: string;
        /** URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result */
        thumbUrl: string;
        /** MIME type of the thumbnail, must be one of “image/jpeg”, “image/gif”, or “video/mp4”. Defaults to “image/jpeg” */
        thumbMimeType?: 'image/jpeg' | 'image/gif' | 'video/mp4';
        /** Width of the GIF */
        width?: number;
        /** Height of the GIF */
        height?: number;
        /** Duration of the GIF */
        duration?: number;
      }
    // from cached file
    | {
        /** The file id of animated GIF file stored on the Telegram servers */
        fileId: string;
      }
  ) & {
    /** Title for the result */
    title?: string;
    /** Texual node of the file caption, 0-1024 characters after entities parsing */
    caption?: MachinatNode;
    /** Mode for parsing entities of the file caption. See formatting options for more details. */
    parseMode?: TelegramParseMode;
  };

/**
 * Represents a link to an animated GIF file. By default, this animated GIF file will be sent by the user with optional caption. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the animation.
 * @category Component
 * @props {@link InlineQueryResultGifProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultgif).
 */
export const InlineQueryResultGif: TelegramComponent<
  InlineQueryResultGifProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultGif(
  node,
  path,
  render
) {
  const {
    id,
    fileId,
    url,
    width,
    height,
    duration,
    thumbUrl,
    thumbMimeType,
    title,
    caption,
    parseMode = 'HTML',
    replyMarkup,
    inputMessageContent,
  } = node.props as UnionToIntersection<InlineQueryResultGifProps>;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
    captionSegments,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
    render(caption, '.caption'),
  ]);

  return [
    partSegment(node, path, {
      type: 'gif',
      id,
      gif_file_id: fileId,
      gif_url: url,
      gif_width: width,
      gif_height: height,
      gif_duration: duration,
      title,
      caption: captionSegments?.[0].value,
      parse_mode: parseMode === 'None' ? undefined : parseMode,
      thumb_url: thumbUrl,
      thumb_mime_type: thumbMimeType,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultMpeg4GifProps = InlineQueryResultProps &
  (
    | // from URL
    {
        /** A valid URL of the MP4 file. File size must not exceed 1MB */
        url: string;
        /** URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result */
        thumbUrl: string;
        /** MIME type of the thumbnail, must be one of “image/jpeg”, “image/gif”, or “video/mp4”. Defaults to “image/jpeg” */
        thumbMimeType?: 'image/jpeg' | 'image/gif' | 'video/mp4';
        /** Width of the video */
        width?: number;
        /** Height of the video */
        height?: number;
        /** Duration of the video */
        duration?: number;
      }
    // from cached file
    | {
        /** The file id of MP4 file stored on the Telegram servers */
        fileId: string;
      }
  ) & {
    /** Title for the result */
    title?: string;
    /** Texual node of the file caption, 0-1024 characters after entities parsing */
    caption?: MachinatNode;
    /** Mode for parsing entities of the file caption. */
    parseMode?: TelegramParseMode;
  };

/**
 * Represents a link to a video animation (H.264/MPEG-4 AVC video without sound). By default, this animated MPEG-4 file will be sent by the user with optional caption. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the animation.
 * @category Component
 * @props {@link InlineQueryResultMpeg4GifProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultmpeg4gif).
 */
export const InlineQueryResultMpeg4Gif: TelegramComponent<
  InlineQueryResultMpeg4GifProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultMpeg4Gif(
  node,
  path,
  render
) {
  const {
    id,
    fileId,
    url,
    width,
    height,
    duration,
    thumbUrl,
    thumbMimeType,
    title,
    caption,
    parseMode = 'HTML',
    replyMarkup,
    inputMessageContent,
  } = node.props as UnionToIntersection<InlineQueryResultMpeg4GifProps>;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
    captionSegments,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
    render(caption, '.caption'),
  ]);

  return [
    partSegment(node, path, {
      type: 'mpeg4_gif',
      id,
      mpeg4_file_id: fileId,
      mpeg4_url: url,
      mpeg4_width: width,
      mpeg4_height: height,
      mpeg4_duration: duration,
      title,
      caption: captionSegments?.[0].value,
      parse_mode: parseMode === 'None' ? undefined : parseMode,
      thumb_url: thumbUrl,
      thumb_mime_type: thumbMimeType,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultVideoProps = InlineQueryResultProps &
  (
    | // from URL
    {
        /** A valid URL of the MP4 file. File size must not exceed 1MB */
        url: string;
        /** Mime type of the content of video url, “text/html” or “video/mp4” */
        mimeType: 'text/html' | 'video/mp4';
        /** URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result */
        thumbUrl: string;
        /** Width of the video */
        width?: number;
        /** Height of the video */
        height?: number;
        /** Duration of the video */
        duration?: number;
      } // from cached file
    | {
        /** The file id of video stored on the Telegram servers */
        fileId: string;
      }
  ) & {
    /** Title for the result */
    title?: string;
    /**  Short description for the result */
    description?: string;
    /** Texual node of the file caption, 0-1024 characters after entities parsing */
    caption?: MachinatNode;
    /** Mode for parsing entities of the file caption. */
    parseMode?: TelegramParseMode;
  };

/**
 * Represents a link to a page containing an embedded video player or a video file. By default, this video file will be sent by the user with an optional caption. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the video.
 * @category Component
 * @props {@link InlineQueryResultVideoProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultvideo).
 */
export const InlineQueryResultVideo: TelegramComponent<
  InlineQueryResultVideoProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultVideo(
  node,
  path,
  render
) {
  const {
    id,
    fileId,
    url,
    title,
    description,
    caption,
    parseMode = 'HTML',
    mimeType,
    width,
    height,
    duration,
    thumbUrl,
    replyMarkup,
    inputMessageContent,
  } = node.props as UnionToIntersection<InlineQueryResultVideoProps>;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
    captionSegments,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
    render(caption, '.caption'),
  ]);

  return [
    partSegment(node, path, {
      type: 'video',
      id,
      video_file_id: fileId,
      video_url: url,
      video_width: width,
      video_height: height,
      video_duration: duration,
      mime_type: mimeType,
      title,
      description,
      caption: captionSegments?.[0].value,
      parse_mode: parseMode === 'None' ? undefined : parseMode,
      thumb_url: thumbUrl,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultAudioProps = InlineQueryResultProps &
  (
    | // from URL
    {
        /** A valid URL of the audio file. File size must not exceed 1MB */
        url: string;
        /** Duration of the audio */
        duration?: number;
        /** Title */
        title?: string;
        /** Performer */
        performer?: string;
      } // from cached file
    | {
        /** The file id of audio file stored on the Telegram servers */
        fileId: string;
      }
  ) & {
    /** Texual node of the file caption, 0-1024 characters after entities parsing */
    caption?: MachinatNode;
    /** Mode for parsing entities of the file caption. */
    parseMode?: TelegramParseMode;
  };

/**
 * Represents a link to an MP3 audio file. By default, this audio file will be sent by the user. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the audio.
 * @category Component
 * @props {@link InlineQueryResultAudioProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultaudio).
 */
export const InlineQueryResultAudio: TelegramComponent<
  InlineQueryResultAudioProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultAudio(
  node,
  path,
  render
) {
  const {
    id,
    fileId,
    url,
    title,
    performer,
    caption,
    parseMode = 'HTML',
    duration,
    replyMarkup,
    inputMessageContent,
  } = node.props as UnionToIntersection<InlineQueryResultAudioProps>;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
    captionSegments,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
    render(caption, '.caption'),
  ]);

  return [
    partSegment(node, path, {
      type: 'audio',
      id,
      audio_file_id: fileId,
      audio_url: url,
      audio_duration: duration,
      title,
      performer,
      caption: captionSegments?.[0].value,
      parse_mode: parseMode === 'None' ? undefined : parseMode,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultVoiceProps = InlineQueryResultProps &
  (
    | // from URL
    {
        /** A valid URL of the audio file. File size must not exceed 1MB */
        url: string;
        /** Duration of the voice recording */
        duration?: number;
      } // from cached file
    | {
        /** The file id of voice file stored on the Telegram servers */
        fileId: string;
      }
  ) & {
    /** Title */
    title?: string;
    /** Texual node of the file caption, 0-1024 characters after entities parsing */
    caption?: MachinatNode;
    /** Mode for parsing entities of the file caption. */
    parseMode?: TelegramParseMode;
  };

/**
 * Represents a link to a voice recording in an .OGG container encoded with OPUS. By default, this voice recording will be sent by the user. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the the voice message.
 * @category Component
 * @props {@link InlineQueryResultVoiceProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultvoice).
 */
export const InlineQueryResultVoice: TelegramComponent<
  InlineQueryResultVoiceProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultVoice(
  node,
  path,
  render
) {
  const {
    id,
    fileId,
    url,
    title,
    caption,
    parseMode = 'HTML',
    duration,
    replyMarkup,
    inputMessageContent,
  } = node.props as UnionToIntersection<InlineQueryResultVoiceProps>;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
    captionSegments,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
    render(caption, '.caption'),
  ]);

  return [
    partSegment(node, path, {
      type: 'voice',
      id,
      voice_file_id: fileId,
      voice_url: url,
      voice_duration: duration,
      title,
      caption: captionSegments?.[0].value,
      parse_mode: parseMode === 'None' ? undefined : parseMode,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultDocumentProps = InlineQueryResultProps &
  (
    | // from URL
    {
        /** A valid URL of the file. Photo must be in jpeg format. Photo size must not exceed 5MB */
        url: string;
        /** Mime type of the content of the file, either “application/pdf” or “application/zip” */
        mimeType: 'application/pdf' | 'application/zip';
        /** URL of the thumbnail for the file */
        thumbUrl?: string;
        /** Thumbnail width */
        thumbWidth?: number;
        /** Thumbnail height */
        thumbHeight?: number;
      } // from cached file
    | {
        /** The file id of document stored on the Telegram servers */
        fileId: string;
      }
  ) & {
    /** Title for the result */
    title: string;
    /** Short description of the result */
    description?: string;
    /** Texual node as  the caption of the photo to be sent, 0-1024 characters after entities parsing */
    caption?: MachinatNode;
    /** Mode for parsing entities in the photo caption. See formatting options for more details. */
    parseMode?: TelegramParseMode;
  };

/**
 * Represents a link to a file. By default, this file will be sent by the user with an optional caption. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the file. Currently, only .PDF and .ZIP files can be sent using this method.
 * @category Component
 * @props {@link InlineQueryResultDocumentProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultdocument).
 */
export const InlineQueryResultDocument: TelegramComponent<
  InlineQueryResultDocumentProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultDocument(
  node,
  path,
  render
) {
  const {
    id,
    fileId,
    url,
    mimeType,
    thumbWidth,
    thumbHeight,
    thumbUrl,
    title,
    description,
    caption,
    parseMode = 'HTML',
    replyMarkup,
    inputMessageContent,
  } = node.props as UnionToIntersection<InlineQueryResultDocumentProps>;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
    captionSegments,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
    render(caption, '.caption'),
  ]);

  return [
    partSegment(node, path, {
      type: 'document',
      id,
      document_file_id: fileId,
      document_url: url,
      mimeType,
      title,
      description,
      caption: captionSegments?.[0].value,
      parse_mode: parseMode === 'None' ? undefined : parseMode,
      thumb_url: thumbUrl,
      thumb_width: thumbWidth,
      thumb_height: thumbHeight,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultStickerProps = InlineQueryResultProps & {
  /** The file id of sticker stored on the Telegram servers */
  fileId: string;
};

/**
 * Represents a link to a sticker stored on the Telegram servers. By default, this sticker will be sent by the user. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the sticker.
 * @category Component
 * @props {@link InlineQueryResultStickerProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultcachedsticker).
 */
export const InlineQueryResultSticker: TelegramComponent<
  InlineQueryResultStickerProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultSticker(
  node,
  path,
  render
) {
  const { id, fileId, replyMarkup, inputMessageContent } = node.props;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
  ]);

  return [
    partSegment(node, path, {
      type: 'sticker',
      id,
      sticker_file_id: fileId,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultLocationProps = InlineQueryResultProps & {
  /** Location latitude in degrees */
  latitude: number;
  /** Location longitude in degrees */
  longitude: number;
  /** Location title */
  title: string;
  /** Period in seconds for which the location can be updated, should be between 60 and 86400. */
  livePeriod?: number;
  /** URL of the thumbnail for the loaction */
  thumbUrl?: string;
  /** Thumbnail width */
  thumbWidth?: number;
  /** Thumbnail height */
  thumbHeight?: number;
};

/**
 * Represents a location on a map. By default, the location will be sent by the user. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the location.
 * @category Component
 * @props {@link InlineQueryResultLocationProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultloacation).
 */
export const InlineQueryResultLocation: TelegramComponent<
  InlineQueryResultLocationProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultLocation(
  node,
  path,
  render
) {
  const {
    id,
    replyMarkup,
    inputMessageContent,
    latitude,
    longitude,
    livePeriod,
    title,
    thumbUrl,
    thumbWidth,
    thumbHeight,
  } = node.props;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
  ]);

  return [
    partSegment(node, path, {
      type: 'location',
      id,
      latitude,
      longitude,
      live_period: livePeriod,
      title,
      thumb_url: thumbUrl,
      thumb_width: thumbWidth,
      thumb_height: thumbHeight,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultVenueProps = InlineQueryResultProps & {
  /** Location latitude of the venue in degrees */
  latitude: number;
  /** Location longitude of the venue in degrees */
  longitude: number;
  /** Title of the venue */
  title: string;
  /** Address of the venue */
  address: string;
  /** Foursquare identifier of the venue if known */
  foursquareId?: string;
  /** Foursquare type of the venue, if known. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
  foursquareType?: string;
  /** URL of the thumbnail for the venue */
  thumbUrl?: string;
  /** Thumbnail width */
  thumbWidth?: number;
  /** Thumbnail height */
  thumbHeight?: number;
};

/**
 * Represents a venue. By default, the venue will be sent by the user. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the venue.
 * @category Component
 * @props {@link InlineQueryResultVenueProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultvenue).
 */
export const InlineQueryResultVenue: TelegramComponent<
  InlineQueryResultVenueProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultVenue(
  node,
  path,
  render
) {
  const {
    id,
    replyMarkup,
    inputMessageContent,
    latitude,
    longitude,
    address,
    foursquareId,
    foursquareType,
    title,
    thumbUrl,
    thumbWidth,
    thumbHeight,
  } = node.props;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
  ]);

  return [
    partSegment(node, path, {
      type: 'venue',
      id,
      latitude,
      longitude,
      address,
      foursquare_id: foursquareId,
      foursquare_type: foursquareType,
      title,
      thumb_url: thumbUrl,
      thumb_width: thumbWidth,
      thumb_height: thumbHeight,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

/**
 * @category Props
 */
type InlineQueryResultContactProps = InlineQueryResultProps & {
  /** Contact's phone number */
  phoneNumber: string;
  /** Contact's first name */
  firstName: string;
  /** Contact's last name */
  lastName?: string;
  /** Additional data about the contact in the form of a vCard, 0-2048 bytes */
  vcard?: string;
  /** URL of the thumbnail for the contact */
  thumbUrl?: string;
  /** Thumbnail width */
  thumbWidth?: number;
  /** Thumbnail height */
  thumbHeight?: number;
};

/**
 * Represents a contact with a phone number. By default, this contact will be sent by the user. Alternatively, you can use inputMessageContent to send a message with the specified content instead of the contact.
 * @category Component
 * @props {@link InlineQueryResultContactProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultcontact).
 */
export const InlineQueryResultContact: TelegramComponent<
  InlineQueryResultContactProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultContact(
  node,
  path,
  render
) {
  const {
    id,
    phoneNumber,
    firstName,
    lastName,
    vcard,
    thumbUrl,
    thumbWidth,
    thumbHeight,
    replyMarkup,
    inputMessageContent,
  } = node.props;

  const [
    inputMessageContentObject,
    inlineKeyboardSegemnts,
  ] = await Promise.all([
    renderInputMessageContent(inputMessageContent, render),
    render(replyMarkup, '.replyMarkup'),
  ]);

  return [
    partSegment(node, path, {
      type: 'contact',
      id,
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      vcard,
      thumb_url: thumbUrl,
      thumb_width: thumbWidth,
      thumb_height: thumbHeight,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
      input_message_content: inputMessageContentObject,
    }),
  ];
});

export interface InlineQueryResultGameProps {
  /** Unique identifier for this result, 1-64 bytes */
  id: string;
  /** Short name of the game */
  gameShortName: string;
  /** One {@link InlineKeyboardMarkup} element attached to the message */
  replyMarkup?: MachinatNode;
}

/**
 * Represents a Game.
 * @category Component
 * @props {@link InlineQueryResultGameProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#inlinequeryresultgame).
 */
export const InlineQueryResultGame: TelegramComponent<
  InlineQueryResultGameProps,
  PartSegment<any>
> = annotateTelegramComponent(async function InlineQueryResultGame(
  node,
  path,
  render
) {
  const { id, gameShortName, replyMarkup } = node.props;
  const inlineKeyboardSegemnts = await render(replyMarkup, '.replyMarkup');

  return [
    partSegment(node, path, {
      type: 'contact',
      id,
      game_short_name: gameShortName,
      reply_markup: inlineKeyboardSegemnts?.[0].value,
    }),
  ];
});

export type InlineQueryResult =
  | typeof InlineQueryResultArticle
  | typeof InlineQueryResultAudio
  | typeof InlineQueryResultContact
  | typeof InlineQueryResultDocument
  | typeof InlineQueryResultGif
  | typeof InlineQueryResultGame
  | typeof InlineQueryResultLocation
  | typeof InlineQueryResultMpeg4Gif
  | typeof InlineQueryResultPhoto
  | typeof InlineQueryResultSticker
  | typeof InlineQueryResultVoice
  | typeof InlineQueryResultVideo
  | typeof InlineQueryResultVenue;

/**
 * @category Props
 */
export interface AnswerInlineQueryProps {
  /** Unique identifier for the answered query */
  queryId: string;
  /** {@link InlineQueryResult} elements as the results to be displayed */
  children?: MachinatNode;
  /** The maximum amount of time in seconds that the result of the inline query may be cached on the server. Defaults to 300. */
  cacheTime?: number;
  /** Pass True, if results may be cached on the server side only for the user that sent the query. By default, results may be returned to any user who sends the same query */
  isPersonal?: boolean;
  /** Pass the offset that a client should send in the next query with the same text to receive more results. Pass an empty string if there are no more results or if you don't support pagination. Offset length can't exceed 64 bytes. */
  nextOffset?: string;
  /** If passed, clients will display a button with specified text that switches the user to a private chat with the bot and sends the bot a start message with the parameter switch_pm_parameter */
  switchPMText?: string;
  /** Deep-linking parameter for the /start message sent to the bot when user presses the switch button. 1-64 characters, only A-Z, a-z, 0-9, _ and - are allowed. */
  switchPMParameter?: string;
}

/**
 * Send answers to an inline query
 * @category Component
 * @props {@link AnswerInlineQueryProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#answerInlineQuery).
 */
export const AnswerInlineQuery: TelegramComponent<
  AnswerInlineQueryProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(async function AnswerInlineQuery(
  node,
  path,
  render
) {
  const {
    children,
    queryId,
    cacheTime,
    isPersonal,
    nextOffset,
    switchPMText,
    switchPMParameter,
  } = node.props;

  const resultSegments = await render(children, '.children');

  return [
    unitSegment<TelegramSegmentValue>(node, path, {
      method: 'answerInlineQuery',
      toDirectInstance: true,
      parameters: {
        inline_query_id: queryId,
        results: resultSegments?.map(({ value }) => value) || [],
        cache_time: cacheTime,
        is_personal: isPersonal,
        next_offset: nextOffset,
        switch_pm_text: switchPMText,
        switch_pm_parameter: switchPMParameter,
      },
    }),
  ];
});

/** This object represents a portion of the price for goods or services. */
type LabeledPrice = {
  /** Portion label */
  label: string;
  /** Price of the product in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  amount: number;
};

/** This object represents one shipping option. */
type ShippingOption = {
  /** Shipping option identifier */
  id: string;
  /** Option title */
  title?: string;
  /** List of price portions */
  prices: LabeledPrice[];
};

/**
 * @category Props
 */
export interface AnswerShippingQueryProps {
  /** Unique identifier for the query to be answered */
  queryId: string;
  /** Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible) */
  ok: boolean;
  /** Required if ok is True. A JSON-serialized array of available shipping options. */
  shippingOptions?: ShippingOption[];
  /** Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user. */
  errorMessage?: string;
}

/**
 * Send answers to an inline query
 * @category Component
 * @props {@link AnswerInlineQueryProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#answerInlineQuery).
 */
export const AnswerShippingQuery: TelegramComponent<
  AnswerShippingQueryProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(function AnswerShippingQuery(node, path) {
  const { queryId, ok, shippingOptions, errorMessage } = node.props;

  return [
    unitSegment<TelegramSegmentValue>(node, path, {
      method: 'answerShippingQuery',
      toDirectInstance: true,
      parameters: {
        shipping_query_id: queryId,
        ok,
        shipping_options: shippingOptions,
        error_message: errorMessage,
      },
    }),
  ];
});

/**
 * @category Props
 */
export interface AnswerPreCheckoutQueryProps {
  /** Unique identifier for the query to be answered */
  queryId: string;
  /** Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible) */
  ok: boolean;
  /** Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user. */
  errorMessage?: string;
}

/**
 * Send answers to an inline query
 * @category Component
 * @props {@link AnswerInlineQueryProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#answerInlineQuery).
 */
export const AnswerPreCheckoutQuery: TelegramComponent<
  AnswerPreCheckoutQueryProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(function AnswerPreCheckoutQuery(node, path) {
  const { queryId, ok, errorMessage } = node.props;

  return [
    unitSegment<TelegramSegmentValue>(node, path, {
      method: 'answerPreCheckoutQuery',
      toDirectInstance: true,
      parameters: {
        pre_checkout_query_id: queryId,
        ok,
        error_message: errorMessage,
      },
    }),
  ];
});
