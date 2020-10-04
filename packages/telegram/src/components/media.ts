import { MachinatNode } from '@machinat/core/types';
import { unitSegment } from '@machinat/core/renderer';
import formatNode from '@machinat/core/utils/formatNode';
import type { UnitSegment, FunctionOf } from '@machinat/core/renderer/types';
import { annotateTelegramComponent } from '../utils';
import {
  TelegramSegmentValue,
  UploadingFile,
  UploadingFileInfo,
  TelegramComponent,
  MessageProps,
  TelegramParseMode,
} from '../types';

type FileIdProps = {
  /** The file id already stored somewhere on the Telegram servers. */
  fileId: string;
};

type FileURLProps = {
  /** HTTP URL for the file to be sent. */
  url: string;
};

type FileDataProps = {
  /** The file content data when uploading the file directly. */
  fileData: string | Buffer | NodeJS.ReadableStream;
  /** Metadata about the uploading `fileData` if needed (while using Buffer). */
  fileInfo?: UploadingFileInfo;
  /**
   * The asset tag for {@link TelegramAssetsManager} to save the uploaded file
   * id with. This prop only annotates on the created job, you have to add
   * {@link saveUplodedFile} middleware to make automatical saving happen.
   */
  fileAssetTag?: string;
};

type WithFileProps = FileIdProps | FileURLProps | FileDataProps;

type FlattenFileProps<T> = Omit<T, keyof WithFileProps> &
  Partial<FileIdProps> &
  Partial<FileURLProps> &
  Partial<FileDataProps>;

type WithCaptionProps = {
  /** File caption (may also be used when resending photos by file_id), 0-1024 characters after entities parsing */
  caption?: MachinatNode;
  /** Mode for parsing entities in the `caption`. Default to `'HTML'`.  */
  parseMode?: TelegramParseMode;
};

type WithThumbnailProps = {
  /** Thumbnail file data. Can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. */
  thumbnailFileData?: Buffer | NodeJS.ReadableStream;
  /** Metadata about the uploading `thumbnailFileData` if needed (while using Buffer). */
  thumbnailFileInfo?: UploadingFileInfo;
};

/**
 * @category Props
 */
type PhotoProps = MessageProps & WithFileProps & WithCaptionProps;

/** @ignore */
const __Photo: FunctionOf<TelegramComponent<
  PhotoProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Photo(node, path, render) {
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
    fileAssetTag,
  } = node.props as FlattenFileProps<PhotoProps>;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    unitSegment(node, path, {
      method: 'sendPhoto',
      parameters: {
        photo: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      uploadingFiles: fileData
        ? [
            {
              fieldName: 'photo',
              fileData,
              fileInfo,
              fileAssetTag,
            },
          ]
        : undefined,
    }),
  ];
};
/**
 * Send a photo by a `file_id` alreay uploaded, a external url or uploading a new file.
 * @category Component
 * @props {@link PhotoProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendphoto).
 */
export const Photo: TelegramComponent<
  PhotoProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Photo);

/**
 * @category Props
 */
type AudioProps = MessageProps &
  WithFileProps &
  WithCaptionProps &
  WithThumbnailProps & {
    /** Duration of the audio in seconds */
    duration?: number;
    /** Performer */
    performer?: string;
    /** Track name */
    title?: string;
  };
/** @ignore */
const __Audio: FunctionOf<TelegramComponent<
  AudioProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Audio(node, path, render) {
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
    fileAssetTag,
  } = node.props as FlattenFileProps<AudioProps>;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const uploadingFiles: UploadingFile[] = [];

  if (fileData) {
    uploadingFiles.push({
      fieldName: 'audio',
      fileData,
      fileInfo,
      fileAssetTag,
    });
  }

  if (thumbnailFileData) {
    uploadingFiles.push({
      fieldName: 'thumb',
      fileData: thumbnailFileData,
      fileInfo: thumbnailFileInfo,
      fileAssetTag: undefined,
    });
  }

  return [
    unitSegment(node, path, {
      method: 'sendAudio',
      parameters: {
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
      uploadingFiles,
    }),
  ];
};
/**
 * Send a audio by a `file_id` alreay uploaded, a external url or uploading a new file.
 * @category Component
 * @props {@link AudioProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendaudio).
 */
export const Audio: TelegramComponent<
  AudioProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Audio);

/**
 * @category Props
 */
type DocumentProps = MessageProps &
  WithFileProps &
  WithCaptionProps &
  WithThumbnailProps;

/** @ignore */
const __Document: FunctionOf<TelegramComponent<
  DocumentProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Document(node, path, render) {
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
    fileAssetTag,
  } = node.props as FlattenFileProps<DocumentProps>;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const uploadingFiles: UploadingFile[] = [];

  if (fileData) {
    uploadingFiles.push({
      fieldName: 'document',
      fileData,
      fileInfo,
      fileAssetTag,
    });
  }

  if (thumbnailFileData) {
    uploadingFiles.push({
      fieldName: 'thumb',
      fileData: thumbnailFileData,
      fileInfo: thumbnailFileInfo,
      fileAssetTag: undefined,
    });
  }

  return [
    unitSegment(node, path, {
      method: 'sendDocument',
      parameters: {
        document: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      uploadingFiles,
    }),
  ];
};
/**
 * Send a document by a `file_id` alreay uploaded, a external url or uploading a new file.
 * @category Component
 * @props {@link DocumentProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#senddocument).
 */
export const Document: TelegramComponent<
  DocumentProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Document);

/**
 * @category Props
 */
type VideoProps = MessageProps &
  WithFileProps &
  WithCaptionProps &
  WithThumbnailProps & {
    /** Duration of sent video in seconds */
    duration?: number;
    /** Video width */
    width?: number;
    /** Video height */
    height?: number;
    /** Pass True, if the uploaded video is suitable for streaming */
    supportsStreaming?: boolean;
  };

/** @ignore */
const __Video: FunctionOf<TelegramComponent<
  VideoProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Video(node, path, render) {
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
    fileAssetTag,
  } = node.props as FlattenFileProps<VideoProps>;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const uploadingFiles: UploadingFile[] = [];

  if (fileData) {
    uploadingFiles.push({
      fieldName: 'video',
      fileData,
      fileInfo,
      fileAssetTag,
    });
  }

  if (thumbnailFileData) {
    uploadingFiles.push({
      fieldName: 'thumb',
      fileData: thumbnailFileData,
      fileInfo: thumbnailFileInfo,
      fileAssetTag: undefined,
    });
  }

  return [
    unitSegment(node, path, {
      method: 'sendVideo',
      parameters: {
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
      uploadingFiles,
    }),
  ];
};
/**
 * Send a video by a `file_id` alreay uploaded, a external url or uploading a new file.
 * @category Component
 * @props {@link VideoProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendvideo).
 */
export const Video: TelegramComponent<
  VideoProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Video);

/**
 * @category Props
 */
type AnimationProps = MessageProps &
  WithFileProps &
  WithCaptionProps &
  WithThumbnailProps & {
    /** Duration of sent animation in seconds */
    duration?: number;
    /** Animation width */
    width?: number;
    /** Animation height */
    height?: number;
  };

/** @ignore */
const __Animation: FunctionOf<TelegramComponent<
  AnimationProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Animation(node, path, render) {
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
    fileAssetTag,
  } = node.props as FlattenFileProps<AnimationProps>;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const uploadingFiles: UploadingFile[] = [];

  if (fileData) {
    uploadingFiles.push({
      fieldName: 'animation',
      fileData,
      fileInfo,
      fileAssetTag,
    });
  }

  if (thumbnailFileData) {
    uploadingFiles.push({
      fieldName: 'thumb',
      fileData: thumbnailFileData,
      fileInfo: thumbnailFileInfo,
      fileAssetTag: undefined,
    });
  }

  return [
    unitSegment(node, path, {
      method: 'sendAnimation',
      parameters: {
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
      uploadingFiles,
    }),
  ];
};
/**
 * Send a animation by a `file_id` alreay uploaded, a external url or uploading a new file.
 * @category Component
 * @props {@link AnimationProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendanimation).
 */
export const Animation: TelegramComponent<
  AnimationProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Animation);

/**
 * @category Props
 */
type VoiceProps = MessageProps &
  WithFileProps &
  WithCaptionProps & {
    /** Duration of sent voice in seconds */
    duration?: number;
  };

/** @ignore */
const __Voice: FunctionOf<TelegramComponent<
  VoiceProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Voice(node, path, render) {
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
    fileAssetTag,
  } = node.props as FlattenFileProps<VoiceProps>;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  return [
    unitSegment(node, path, {
      method: 'sendVoice',
      parameters: {
        voice: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
        duration,
      },
      uploadingFiles: fileData
        ? [
            {
              fieldName: 'voice',
              fileData,
              fileInfo,
              fileAssetTag,
            },
          ]
        : undefined,
    }),
  ];
};
/**
 * Send a voice by a `file_id` alreay uploaded, a external url or uploading a new file.
 * @category Component
 * @props {@link VoiceProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendvoice).
 */
export const Voice: TelegramComponent<
  VoiceProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Voice);

/**
 * @category Props
 */
type VideoNoteProps = MessageProps &
  WithFileProps &
  WithCaptionProps &
  WithThumbnailProps & {
    /** Duration of sent video note in seconds */
    duration?: number;
    /** Video width and height, i.e. diameter of the video message */
    length?: number;
  };

/** @ignore */
const __VideoNote: FunctionOf<TelegramComponent<
  VideoNoteProps,
  UnitSegment<TelegramSegmentValue>
>> = async function VideoNote(node, path, render) {
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
    fileAssetTag,
  } = node.props as FlattenFileProps<VideoNoteProps>;

  const captionSegments = await render(caption, '.caption');
  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const uploadingFiles: UploadingFile[] = [];

  if (fileData) {
    uploadingFiles.push({
      fieldName: 'video_note',
      fileData,
      fileInfo,
      fileAssetTag,
    });
  }

  if (thumbnailFileData) {
    uploadingFiles.push({
      fieldName: 'thumb',
      fileData: thumbnailFileData,
      fileInfo: thumbnailFileInfo,
      fileAssetTag: undefined,
    });
  }

  return [
    unitSegment(node, path, {
      method: 'sendVideoNote',
      parameters: {
        video_note: fileId || url || undefined,
        caption: captionSegments?.[0].value,
        parse_mode: parseMode === 'None' ? undefined : parseMode,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
        duration,
        length,
      },
      uploadingFiles,
    }),
  ];
};
/**
 * Send a video note by a `file_id` alreay uploaded, a external url or uploading a new file.
 * @category Component
 * @props {@link VideoNoteProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendvideonote).
 */
export const VideoNote: TelegramComponent<
  VideoNoteProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__VideoNote);

export type MediaGroupProps = {
  /**
   * {@link Photo} and {@link Video} elements to be presented in the group.
   * Please note that {@link MessageProps} of the children are ignored.
   */
  children: MachinatNode;
  /** Sends the message silently. Users will receive a notification with no sound. */
  disableNotification?: boolean;
  /** If the message is a reply, ID of the original message */
  replyToMessageId?: number;
};

/** @ignore */
const __MediaGroup: FunctionOf<TelegramComponent<
  MediaGroupProps,
  UnitSegment<TelegramSegmentValue>
>> = async function MediaGroup(node, path, render) {
  const { children, disableNotification, replyToMessageId } = node.props;

  const mediaSegments = await render(children, '.children');
  if (!mediaSegments) {
    return null;
  }

  let fileCount = 0;
  const mediaFiles: UploadingFile[] = [];
  const inputMedia: any[] = [];

  mediaSegments.forEach(({ node: inputNode, value }) => {
    const { parameters, uploadingFiles } = value;

    let inputType;
    if ('video' in parameters) {
      inputType = 'video';
    } else if ('photo' in parameters) {
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
            media: parameters.photo,
            caption: parameters.caption,
            parse_mode: parameters.parse_mode,
          }
        : {
            type: 'video',
            media: parameters.video,
            caption: parameters.caption,
            thumb: parameters.thumb,
            parse_mode: parameters.parse_mode,
            width: parameters.width,
            height: parameters.height,
            duration: parameters.duration,
            supports_streaming: parameters.supports_streaming,
          };

    if (uploadingFiles) {
      uploadingFiles.forEach(
        ({ fieldName, fileData, fileInfo, fileAssetTag }) => {
          const fileName = `file_${fileCount}`;
          fileCount += 1;

          if (fieldName === 'thumb') {
            input.thumb = `attach://${fileName}`;
          } else {
            input.media = `attach://${fileName}`;
          }

          mediaFiles.push({
            fieldName: fileName,
            fileData,
            fileInfo,
            fileAssetTag,
          });
        }
      );
    }

    inputMedia.push(input);
  });

  return [
    unitSegment(node, path, {
      method: 'sendMediaGroup',
      parameters: {
        media: inputMedia,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
      },
      uploadingFiles: mediaFiles,
    }),
  ];
};
/**
 * Send a video note by a `file_id` alreay uploaded, a external url or uploading a new file.
 * @category Component
 * @props {@link MediaGroupProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendmediagroup).
 */
export const MediaGroup: TelegramComponent<
  MediaGroupProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__MediaGroup);

/**
 * @category Props
 */
type StickerProps = MessageProps & WithFileProps;

/** @ignore */
const __Sticker: FunctionOf<TelegramComponent<
  StickerProps,
  UnitSegment<TelegramSegmentValue>
>> = async function Sticker(node, path, render) {
  const {
    fileId,
    url,
    fileData,
    fileInfo,
    disableNotification,
    replyToMessageId,
    replyMarkup,
    fileAssetTag,
  } = node.props as FlattenFileProps<StickerProps>;

  const replyMarkupSegments = await render(replyMarkup, '.replyMarkup');
  const uploadingFiles: UploadingFile[] = [];

  if (fileData) {
    uploadingFiles.push({
      fieldName: 'sticker',
      fileData,
      fileInfo,
      fileAssetTag,
    });
  }

  return [
    unitSegment(node, path, {
      method: 'sendSticker',
      parameters: {
        sticker: fileId || url || undefined,
        disable_notification: disableNotification,
        reply_to_message_id: replyToMessageId,
        reply_markup: replyMarkupSegments?.[0].value,
      },
      uploadingFiles,
    }),
  ];
};
/**
 * Send static .WEBP or animated .TGS stickers
 * @category Component
 * @props {@link StickerProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendsticker).
 */
export const Sticker: TelegramComponent<
  StickerProps,
  UnitSegment<TelegramSegmentValue>
> = annotateTelegramComponent(__Sticker);
