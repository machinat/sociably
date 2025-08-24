import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';
import makeTelegramComponent from '../utils/makeTelegramComponent.js';
import {
  TelegramSegmentValue,
  UploadingFileSource,
  UploadingFileInfo,
  TelegramComponent,
  TelegramParseMode,
} from '../types.js';
import { MessageProps } from './types.js';

export type FileProps = {
  /** The file id already stored somewhere on the Telegram servers. */
  fileId?: string;
  /** HTTP URL for the file to be sent. */
  url?: string;
  /** The file content data when uploading the file directly. */
  file?: UploadingFileSource;
  /**
   * The asset tag for {@link TelegramAssetsManager} to save the uploaded file id
   * with. This prop only annotates on the created job, you have to add
   * {@link saveUplodedFile} middleware to make automatical saving happen.
   */
  assetTag?: string;
};

export type CaptionProps = {
  /**
   * File caption (may also be used when resending photos by file_id), 0-1024
   * characters after entities parsing
   */
  caption?: SociablyNode;
  /** Mode for parsing entities in the `caption`. Default to `'HTML'`. */
  parseMode?: TelegramParseMode;
};

export type ThumbnailProps = {
  /**
   * Thumbnail file data. Can be ignored if thumbnail generation for the file is
   * supported server-side. The thumbnail should be in JPEG format and less than
   * 200 kB in size. A thumbnail's width and height should not exceed 320.
   */
  thumbnailFile?: UploadingFileSource;
};

/** @category Props */
export type PhotoProps = {} & MessageProps & FileProps & CaptionProps;

/**
 * Send a photo by a `file_id` alreay uploaded, a external url or uploading a
 * new file.
 *
 * @category Component
 * @props {@link PhotoProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendphoto).
 */
export const Photo: TelegramComponent<
  PhotoProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function Photo(node, path, render) {
  const {
    fileId,
    url,
    file,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    assetTag,
  } = node.props;

  const [captionSegments, replyMarkupSegments] = await Promise.all([
    render(caption, '.caption'),
    render(replyMarkup, '.replyMarkup'),
  ]);
  return [
    makeUnitSegment(node, path, {
      method: 'sendPhoto',
      params: {
        photo: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      files: file
        ? [
            {
              fieldName: 'photo',
              source: file,
              assetTag,
            },
          ]
        : undefined,
    }),
  ];
});

/** @category Props */
export type AudioProps = {
  /** Duration of the audio in seconds */
  duration?: number;
  /** Performer */
  performer?: string;
  /** Track name */
  title?: string;
} & MessageProps &
  FileProps &
  CaptionProps &
  ThumbnailProps;

/**
 * Send a audio by a `file_id` alreay uploaded, a external url or uploading a
 * new file.
 *
 * @category Component
 * @props {@link AudioProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendaudio).
 */
export const Audio: TelegramComponent<
  AudioProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function Audio(node, path, render) {
  const {
    fileId,
    url,
    file,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    duration,
    performer,
    title,
    thumbnailFile,
    assetTag,
  } = node.props;

  const [captionSegments, replyMarkupSegments] = await Promise.all([
    render(caption, '.caption'),
    render(replyMarkup, '.replyMarkup'),
  ]);
  const files: UploadingFileInfo[] = [];

  if (file) {
    files.push({
      fieldName: 'audio',
      source: file,
      assetTag,
    });
  }

  if (thumbnailFile) {
    files.push({
      fieldName: 'thumb',
      source: thumbnailFile,
      assetTag: undefined,
    });
  }

  return [
    makeUnitSegment(node, path, {
      method: 'sendAudio',
      params: {
        audio: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
        duration,
        performer,
        title,
      },
      files,
    }),
  ];
});

/** @category Props */
export type DocumentProps = {} & MessageProps &
  FileProps &
  CaptionProps &
  ThumbnailProps;

/**
 * Send a document by a `file_id` alreay uploaded, a external url or uploading a
 * new file.
 *
 * @category Component
 * @props {@link DocumentProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#senddocument).
 */
export const Document: TelegramComponent<
  DocumentProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function Document(node, path, render) {
  const {
    fileId,
    url,
    file,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    thumbnailFile,
    assetTag,
  } = node.props;

  const [captionSegments, replyMarkupSegments] = await Promise.all([
    render(caption, '.caption'),
    render(replyMarkup, '.replyMarkup'),
  ]);
  const files: UploadingFileInfo[] = [];

  if (file) {
    files.push({
      fieldName: 'document',
      source: file,
      assetTag,
    });
  }

  if (thumbnailFile) {
    files.push({
      fieldName: 'thumb',
      source: thumbnailFile,
      assetTag: undefined,
    });
  }

  return [
    makeUnitSegment(node, path, {
      method: 'sendDocument',
      params: {
        document: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      files,
    }),
  ];
});

/** @category Props */
export type VideoProps = {
  /** Duration of sent video in seconds */
  duration?: number;
  /** Video width */
  width?: number;
  /** Video height */
  height?: number;
  /** Pass True, if the uploaded video is suitable for streaming */
  supportsStreaming?: boolean;
} & MessageProps &
  FileProps &
  CaptionProps &
  ThumbnailProps;

/**
 * Send a video by a `file_id` alreay uploaded, a external url or uploading a
 * new file.
 *
 * @category Component
 * @props {@link VideoProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendvideo).
 */
export const Video: TelegramComponent<
  VideoProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function Video(node, path, render) {
  const {
    fileId,
    url,
    file,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    thumbnailFile,
    duration,
    width,
    height,
    supportsStreaming,
    assetTag,
  } = node.props;

  const [captionSegments, replyMarkupSegments] = await Promise.all([
    render(caption, '.caption'),
    render(replyMarkup, '.replyMarkup'),
  ]);
  const files: UploadingFileInfo[] = [];

  if (file) {
    files.push({
      fieldName: 'video',
      source: file,
      assetTag,
    });
  }
  if (thumbnailFile) {
    files.push({
      fieldName: 'thumb',
      source: thumbnailFile,
      assetTag: undefined,
    });
  }

  return [
    makeUnitSegment(node, path, {
      method: 'sendVideo',
      params: {
        video: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
        duration,
        width,
        height,
        supports_streaming: supportsStreaming,
      },
      files,
    }),
  ];
});

/** @category Props */
export type AnimationProps = {
  /** Duration of sent animation in seconds */
  duration?: number;
  /** Animation width */
  width?: number;
  /** Animation height */
  height?: number;
} & MessageProps &
  FileProps &
  CaptionProps &
  ThumbnailProps;

/**
 * Send a animation by a `file_id` alreay uploaded, a external url or uploading
 * a new file.
 *
 * @category Component
 * @props {@link AnimationProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendanimation).
 */
export const Animation: TelegramComponent<
  AnimationProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function Animation(node, path, render) {
  const {
    fileId,
    url,
    file,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    thumbnailFile,
    duration,
    width,
    height,
    assetTag,
  } = node.props;

  const [captionSegments, replyMarkupSegments] = await Promise.all([
    render(caption, '.caption'),
    render(replyMarkup, '.replyMarkup'),
  ]);
  const files: UploadingFileInfo[] = [];

  if (file) {
    files.push({
      fieldName: 'animation',
      source: file,
      assetTag,
    });
  }

  if (thumbnailFile) {
    files.push({
      fieldName: 'thumb',
      source: thumbnailFile,
      assetTag: undefined,
    });
  }

  return [
    makeUnitSegment(node, path, {
      method: 'sendAnimation',
      params: {
        animation: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
        duration,
        width,
        height,
      },
      files,
    }),
  ];
});

/** @category Props */
export type VoiceProps = {
  /** Duration of sent voice in seconds */
  duration?: number;
} & MessageProps &
  FileProps &
  CaptionProps;

/**
 * Send a voice by a `file_id` alreay uploaded, a external url or uploading a
 * new file.
 *
 * @category Component
 * @props {@link VoiceProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendvoice).
 */
export const Voice: TelegramComponent<
  VoiceProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function Voice(node, path, render) {
  const {
    fileId,
    url,
    file,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    duration,
    assetTag,
  } = node.props;

  const [captionSegments, replyMarkupSegments] = await Promise.all([
    render(caption, '.caption'),
    render(replyMarkup, '.replyMarkup'),
  ]);
  return [
    makeUnitSegment(node, path, {
      method: 'sendVoice',
      params: {
        voice: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
        duration,
      },
      files: file
        ? [
            {
              fieldName: 'voice',
              source: file,
              assetTag,
            },
          ]
        : undefined,
    }),
  ];
});

/** @category Props */
export type VideoNoteProps = {
  /** Duration of sent video note in seconds */
  duration?: number;
  /** Video width and height, i.e. diameter of the video message */
  length?: number;
} & MessageProps &
  FileProps &
  CaptionProps &
  ThumbnailProps;

/**
 * Send a video note by a `file_id` alreay uploaded, a external url or uploading
 * a new file.
 *
 * @category Component
 * @props {@link VideoNoteProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendvideonote).
 */
export const VideoNote: TelegramComponent<
  VideoNoteProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function VideoNote(node, path, render) {
  const {
    fileId,
    url,
    file,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    thumbnailFile,
    duration,
    length,
    assetTag,
  } = node.props;

  const [captionSegments, replyMarkupSegments] = await Promise.all([
    render(caption, '.caption'),
    render(replyMarkup, '.replyMarkup'),
  ]);
  const files: UploadingFileInfo[] = [];

  if (file) {
    files.push({
      fieldName: 'video_note',
      source: file,
      assetTag,
    });
  }

  if (thumbnailFile) {
    files.push({
      fieldName: 'thumb',
      source: thumbnailFile,
      assetTag: undefined,
    });
  }

  return [
    makeUnitSegment(node, path, {
      method: 'sendVideoNote',
      params: {
        video_note: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
        duration,
        length,
      },
      files,
    }),
  ];
});

export type MediaGroupProps = {
  /**
   * {@link Photo} and {@link Video} elements to be presented in the group. Please
   * note that {@link MessageProps} of the children are ignored.
   */
  children: SociablyNode;
  /**
   * Sends the message silently. Users will receive a notification with no
   * sound.
   */
  disableNotification?: boolean;
  /** If the message is a reply, ID of the original message */
  replyToMessageId?: number;
};

/**
 * Send a video note by a `file_id` alreay uploaded, a external url or uploading
 * a new file.
 *
 * @category Component
 * @props {@link MediaGroupProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendmediagroup).
 */
export const MediaGroup: TelegramComponent<
  MediaGroupProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function MediaGroup(node, path, render) {
  const { children, disableNotification, replyToMessageId } = node.props;

  const mediaSegments = await render(children, '.children');
  if (!mediaSegments) {
    return null;
  }

  let fileCount = 0;
  const mediaFiles: UploadingFileInfo[] = [];
  const inputMedia: Record<string, unknown>[] = [];

  mediaSegments.forEach(({ node: inputNode, value }) => {
    const { params, files } = value as TelegramSegmentValue;

    let inputType;
    if ('video' in params) {
      inputType = 'video';
    } else if ('photo' in params) {
      inputType = 'photo';
    } else {
      throw new TypeError(
        `${formatNode(inputNode)} is not a valid media in <MediaGroup/>`,
      );
    }

    const input =
      inputType === 'photo'
        ? {
            type: 'photo',
            media: params.photo,
            caption: params.caption,
            parse_mode: params.parse_mode,
          }
        : {
            type: 'video',
            media: params.video,
            caption: params.caption,
            thumb: params.thumb,
            parse_mode: params.parse_mode,
            width: params.width,
            height: params.height,
            duration: params.duration,
            supports_streaming: params.supports_streaming,
          };

    if (files) {
      files.forEach(({ fieldName, source, assetTag }) => {
        const fileName = `file_${fileCount}`;
        fileCount += 1;

        if (fieldName === 'thumb') {
          input.thumb = `attach://${fileName}`;
        } else {
          input.media = `attach://${fileName}`;
        }

        mediaFiles.push({
          fieldName: fileName,
          source,
          assetTag,
        });
      });
    }

    inputMedia.push(input);
  });

  return [
    makeUnitSegment(node, path, {
      method: 'sendMediaGroup',
      params: {
        media: inputMedia,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
      },
      files: mediaFiles,
    }),
  ];
});

/** @category Props */
export type StickerProps = {} & MessageProps & FileProps;

/**
 * Send static .WEBP or animated .TGS stickers
 *
 * @category Component
 * @props {@link StickerProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendsticker).
 */
export const Sticker: TelegramComponent<
  StickerProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(async function Sticker(node, path, render) {
  const {
    fileId,
    url,
    file,
    disableNotification,
    replyToMessageId,
    replyMarkup,
    assetTag,
  } = node.props;
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');

  return [
    makeUnitSegment(node, path, {
      method: 'sendSticker',
      params: {
        sticker: fileId || url || undefined,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      files: file
        ? [
            {
              fieldName: 'sticker',
              source: file,
              assetTag,
            },
          ]
        : undefined,
    }),
  ];
});
