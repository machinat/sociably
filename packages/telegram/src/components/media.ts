import { SociablyNode } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { formatNode } from '@sociably/core/utils';
import makeTelegramComponent from '../utils/makeTelegramComponent.js';
import {
  TelegramSegmentValue,
  UploadingFile,
  UploadingFileInfo,
  TelegramComponent,
  TelegramParseMode,
} from '../types.js';
import { MessageProps } from './types.js';

export interface FileProps {
  /** The file id already stored somewhere on the Telegram servers. */
  fileId?: string;
  /** HTTP URL for the file to be sent. */
  url?: string;
  /** The file content data when uploading the file directly. */
  fileData?: string | Buffer | NodeJS.ReadableStream;
  /** Metadata about `fileData` if needed (while using Buffer). */
  fileInfo?: UploadingFileInfo;
  /**
   * The asset tag for {@link TelegramAssetsManager} to save the uploaded file
   * id with. This prop only annotates on the created job, you have to add
   * {@link saveUplodedFile} middleware to make automatical saving happen.
   */
  assetTag?: string;
}

export interface CaptionProps {
  /** File caption (may also be used when resending photos by file_id), 0-1024 characters after entities parsing */
  caption?: SociablyNode;
  /** Mode for parsing entities in the `caption`. Default to `'HTML'`.  */
  parseMode?: TelegramParseMode;
}

export interface ThumbnailProps {
  /** Thumbnail file data. Can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. */
  thumbnailFileData?: Buffer | NodeJS.ReadableStream;
  /** Metadata about the uploading `thumbnailFileData` if needed (while using Buffer). */
  thumbnailFileInfo?: UploadingFileInfo;
}

/**
 * @category Props
 */
export interface PhotoProps extends MessageProps, FileProps, CaptionProps {}

/**
 * Send a photo by a `file_id` alreay uploaded, a external url or uploading a new file.
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
    fileData,
    fileInfo,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    assetTag,
  } = node.props;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
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
      files: fileData
        ? [
            {
              fieldName: 'photo',
              data: fileData,
              info: fileInfo,
              assetTag,
            },
          ]
        : undefined,
    }),
  ];
});

/**
 * @category Props
 */
export interface AudioProps
  extends MessageProps,
    FileProps,
    CaptionProps,
    ThumbnailProps {
  /** Duration of the audio in seconds */
  duration?: number;
  /** Performer */
  performer?: string;
  /** Track name */
  title?: string;
}

/**
 * Send a audio by a `file_id` alreay uploaded, a external url or uploading a new file.
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
    fileData,
    fileInfo,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    duration,
    performer,
    title,
    thumbnailFileData,
    thumbnailFileInfo,
    assetTag,
  } = node.props;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const files: UploadingFile[] = [];

  if (fileData) {
    files.push({
      fieldName: 'audio',
      data: fileData,
      info: fileInfo,
      assetTag,
    });
  }

  if (thumbnailFileData) {
    files.push({
      fieldName: 'thumb',
      data: thumbnailFileData,
      info: thumbnailFileInfo,
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

/**
 * @category Props
 */
export interface DocumentProps
  extends MessageProps,
    FileProps,
    CaptionProps,
    ThumbnailProps {}

/**
 * Send a document by a `file_id` alreay uploaded, a external url or uploading a new file.
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
    fileData,
    fileInfo,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    thumbnailFileData,
    thumbnailFileInfo,
    assetTag,
  } = node.props;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const files: UploadingFile[] = [];

  if (fileData) {
    files.push({
      fieldName: 'document',
      data: fileData,
      info: fileInfo,
      assetTag,
    });
  }

  if (thumbnailFileData) {
    files.push({
      fieldName: 'thumb',
      data: thumbnailFileData,
      info: thumbnailFileInfo,
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

/**
 * @category Props
 */
export interface VideoProps
  extends MessageProps,
    FileProps,
    CaptionProps,
    ThumbnailProps {
  /** Duration of sent video in seconds */
  duration?: number;
  /** Video width */
  width?: number;
  /** Video height */
  height?: number;
  /** Pass True, if the uploaded video is suitable for streaming */
  supportsStreaming?: boolean;
}

/**
 * Send a video by a `file_id` alreay uploaded, a external url or uploading a new file.
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
    fileData,
    fileInfo,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    thumbnailFileData,
    thumbnailFileInfo,
    duration,
    width,
    height,
    supportsStreaming,
    assetTag,
  } = node.props;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const files: UploadingFile[] = [];

  if (fileData) {
    files.push({
      fieldName: 'video',
      data: fileData,
      info: fileInfo,
      assetTag,
    });
  }

  if (thumbnailFileData) {
    files.push({
      fieldName: 'thumb',
      data: thumbnailFileData,
      info: thumbnailFileInfo,
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

/**
 * @category Props
 */
export interface AnimationProps
  extends MessageProps,
    FileProps,
    CaptionProps,
    ThumbnailProps {
  /** Duration of sent animation in seconds */
  duration?: number;
  /** Animation width */
  width?: number;
  /** Animation height */
  height?: number;
}

/**
 * Send a animation by a `file_id` alreay uploaded, a external url or uploading a new file.
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
    fileData,
    fileInfo,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    thumbnailFileData,
    thumbnailFileInfo,
    duration,
    width,
    height,
    assetTag,
  } = node.props;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const files: UploadingFile[] = [];

  if (fileData) {
    files.push({
      fieldName: 'animation',
      data: fileData,
      info: fileInfo,
      assetTag,
    });
  }

  if (thumbnailFileData) {
    files.push({
      fieldName: 'thumb',
      data: thumbnailFileData,
      info: thumbnailFileInfo,
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

/**
 * @category Props
 */
export interface VoiceProps extends MessageProps, FileProps, CaptionProps {
  /** Duration of sent voice in seconds */
  duration?: number;
}

/**
 * Send a voice by a `file_id` alreay uploaded, a external url or uploading a new file.
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
    fileData,
    fileInfo,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    duration,
    assetTag,
  } = node.props;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
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
      files: fileData
        ? [
            {
              fieldName: 'voice',
              data: fileData,
              info: fileInfo,
              assetTag,
            },
          ]
        : undefined,
    }),
  ];
});

/**
 * @category Props
 */
export interface VideoNoteProps
  extends MessageProps,
    FileProps,
    CaptionProps,
    ThumbnailProps {
  /** Duration of sent video note in seconds */
  duration?: number;
  /** Video width and height, i.e. diameter of the video message */
  length?: number;
}

/**
 * Send a video note by a `file_id` alreay uploaded, a external url or uploading a new file.
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
    fileData,
    fileInfo,
    caption,
    parseMode = 'HTML',
    disableNotification,
    replyToMessageId,
    replyMarkup,
    thumbnailFileData,
    thumbnailFileInfo,
    duration,
    length,
    assetTag,
  } = node.props;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const files: UploadingFile[] = [];

  if (fileData) {
    files.push({
      fieldName: 'video_note',
      data: fileData,
      info: fileInfo,
      assetTag,
    });
  }

  if (thumbnailFileData) {
    files.push({
      fieldName: 'thumb',
      data: thumbnailFileData,
      info: thumbnailFileInfo,
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

export interface MediaGroupProps {
  /**
   * {@link Photo} and {@link Video} elements to be presented in the group.
   * Please note that {@link MessageProps} of the children are ignored.
   */
  children: SociablyNode;
  /** Sends the message silently. Users will receive a notification with no sound. */
  disableNotification?: boolean;
  /** If the message is a reply, ID of the original message */
  replyToMessageId?: number;
}

/**
 * Send a video note by a `file_id` alreay uploaded, a external url or uploading a new file.
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
  const mediaFiles: UploadingFile[] = [];
  const inputMedia: any[] = [];

  mediaSegments.forEach(({ node: inputNode, value }) => {
    const { params, files } = value;

    let inputType;
    if ('video' in params) {
      inputType = 'video';
    } else if ('photo' in params) {
      inputType = 'photo';
    } else {
      throw new TypeError(
        `${formatNode(inputNode)} is not a valid media in <MediaGroup/>`
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
      files.forEach(({ fieldName, fileData, fileInfo, assetTag }) => {
        const fileName = `file_${fileCount}`;
        fileCount += 1;

        if (fieldName === 'thumb') {
          input.thumb = `attach://${fileName}`;
        } else {
          input.media = `attach://${fileName}`;
        }

        mediaFiles.push({
          fieldName: fileName,
          data: fileData,
          info: fileInfo,
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

/**
 * @category Props
 */
export interface StickerProps extends MessageProps, FileProps {}

/**
 * Send static .WEBP or animated .TGS stickers
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
    fileData,
    fileInfo,
    disableNotification,
    replyToMessageId,
    replyMarkup,
    assetTag,
  } = node.props;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const files: UploadingFile[] = [];

  if (fileData) {
    files.push({
      fieldName: 'sticker',
      data: fileData,
      info: fileInfo,
      assetTag,
    });
  }

  return [
    makeUnitSegment(node, path, {
      method: 'sendSticker',
      params: {
        sticker: fileId || url || undefined,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      files,
    }),
  ];
});
