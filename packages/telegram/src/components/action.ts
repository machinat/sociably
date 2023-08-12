import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeTelegramComponent from '../utils/makeTelegramComponent.js';
import {
  TelegramSegmentValue,
  UploadingFileInfo,
  TelegramComponent,
} from '../types.js';

/**
 * @category Props
 */
export type ForwardMessageProps = {
  /** Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername) */
  fromChatId: number | string;
  /** Message identifier in the chat specified in fromChatId */
  messageId: number;
  /** Sends the message silently. Users will receive a notification with no sound. */
  disableNotification?: boolean;
};

/**
 * Forward messages of any kind
 * @category Component
 * @props {@link ForwardMessageProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#forwardmessage).
 */
export const ForwardMessage: TelegramComponent<
  ForwardMessageProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function ForwardMessage(node, path) {
  const { fromChatId, disableNotification, messageId } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'forwardMessage',
      params: {
        from_chat_id: fromChatId,
        message_id: messageId,
        disable_notification: disableNotification,
      },
    }),
  ];
});

/**
 * @category Props
 */
export type ChatActionProps = {
  /** Type of action to broadcast depending on what the user is about to receive. */
  action:
    | 'typing'
    | 'upload_photo'
    | 'record_video'
    | 'upload_video'
    | 'record_audio'
    | 'upload_audio'
    | 'upload_document'
    | 'find_location'
    | 'record_video_note'
    | 'upload_video_note';
};

/**
 * Inform user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status).
 * @category Component
 * @props {@link ChatActionProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#sendchataction).
 */
export const ChatAction: TelegramComponent<
  ChatActionProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function ChatAction(node, path) {
  const { action } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'sendChatAction',
      params: { action },
    }),
  ];
});

/**
 * @category Props
 */
export type KickChatMemberProps = {
  /** Unique identifier of the target user */
  userId: number;
  /** Date when the user will be unbanned, unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever */
  untilDate?: number | Date;
};

/**
 * Kick a user from a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the group on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
 * @category Component
 * @props {@link KickChatMemberProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#kickchatmember).
 */
export const KickChatMember: TelegramComponent<
  KickChatMemberProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function KickChatMember(node, path) {
  const { userId, untilDate } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'kickChatMember',
      params: {
        user_id: userId,
        until_date:
          untilDate instanceof Date
            ? Math.round(untilDate.getTime() / 1000)
            : untilDate,
      },
    }),
  ];
});

/**
 * @category Props
 */
export type UnbanChatMemberProps = {
  /** Unique identifier of the target user */
  userId: number;
};

/**
 * Unban a previously kicked user in a supergroup or channel. The user will not return to the group or channel automatically, but will be able to join via link, etc. The bot must be an administrator for this to work.
 * @category Component
 * @props {@link UnbanChatMemberProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#unbanchatmember).
 */
export const UnbanChatMember: TelegramComponent<
  UnbanChatMemberProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function UnbanChatMember(node, path) {
  const { userId } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'unbanChatMember',
      params: {
        user_id: userId,
      },
    }),
  ];
});

/**
 * @category Props
 */
export type ChatPromotionProps = {
  /** True, if the user is allowed to send text messages, contacts, locations and venues */
  canSendMessages?: boolean;
  /** True, if the user is allowed to send audios, documents, photos, videos, video notes and voice notes, implies canSendMessages */
  canSendMediaMessages?: boolean;
  /** True, if the user is allowed to send polls, implies canSendMessages */
  canSendPolls?: boolean;
  /** True, if the user is allowed to send animations, games, stickers and use inline bots, implies canSendMediaMessages */
  canSendOtherMessages?: boolean;
  /** True, if the user is allowed to add web page previews to their messages, implies canSendMediaMessages */
  canAddWebPagePreviews?: boolean;
  /** True, if the user is allowed to change the chat title, photo and other settings. Ignored in public supergroups */
  canChangeInfo?: boolean;
  /** True, if the user is allowed to invite new users to the chat */
  canInviteUsers?: boolean;
  /** True, if the user is allowed to pin messages. Ignored in public supergroups */
  canPinMessages?: boolean;
  /** Date when restrictions will be lifted for the user, unix time. If user is restricted for more than 366 days or less than 30 seconds from the current time, they are considered to be restricted forever */
  untilDate?: number | Date;
};

/**
 * @category Props
 */
export type RestrictChatMemberProps = {
  /** Unique identifier of the target user */
  userId: number;
} & ChatPromotionProps;

/**
 * Restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate admin rights. Pass True for all permissions to lift restrictions from a user.
 * @category Component
 * @props {@link RestrictChatMemberProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#restrictchatmember).
 */
export const RestrictChatMember: TelegramComponent<
  RestrictChatMemberProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function RestrictChatMember(node, path) {
  const {
    userId,
    canSendMessages,
    canSendMediaMessages,
    canSendPolls,
    canSendOtherMessages,
    canAddWebPagePreviews,
    canChangeInfo,
    canInviteUsers,
    canPinMessages,
    untilDate,
  } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'restrictChatMember',
      params: {
        user_id: userId,
        permisions: {
          can_send_messages: canSendMessages,
          can_send_media_messages: canSendMediaMessages,
          can_send_polls: canSendPolls,
          can_send_other_messages: canSendOtherMessages,
          can_add_web_page_previews: canAddWebPagePreviews,
          can_change_info: canChangeInfo,
          can_invite_users: canInviteUsers,
          can_pin_messages: canPinMessages,
        },
        until_date:
          untilDate instanceof Date
            ? Math.round(untilDate.getTime() / 1000)
            : untilDate,
      },
    }),
  ];
});

/**
 * @category Props
 */
export type PromoteChatMemberProps = {
  /** Unique identifier of the target user */
  userId: number;
  /** Pass True, if the administrator can change chat title, photo and other settings */
  canChangeInfo?: boolean;
  /** Pass True, if the administrator can create channel posts, channels only */
  canPostMessages?: boolean;
  /** Pass True, if the administrator can edit messages of other users and can pin messages, channels only */
  canEditMessages?: boolean;
  /** Pass True, if the administrator can delete messages of other users */
  canDeleteMessages?: boolean;
  /** Pass True, if the administrator can invite new users to the chat */
  canInviteUsers?: boolean;
  /** Pass True, if the administrator can restrict, ban or unban chat members */
  canRestrictMembers?: boolean;
  /** Pass True, if the administrator can pin messages, supergroups only */
  canPinMessages?: boolean;
  /** Pass True, if the administrator can add new administrators with a subset of their own privileges or demote administrators that he has promoted, directly or indirectly (promoted by administrators that were appointed by him) */
  canPromoteMembers?: boolean;
};

/**
 * Promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Pass False for all boolean params to demote a user.
 * @category Component
 * @props {@link PromoteChatMemberProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#promotechatmember).
 */
export const PromoteChatMember: TelegramComponent<
  PromoteChatMemberProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function PromoteChatMember(node, path) {
  const {
    userId,
    canPostMessages,
    canEditMessages,
    canDeleteMessages,
    canRestrictMembers,
    canPromoteMembers,
    canChangeInfo,
    canInviteUsers,
    canPinMessages,
  } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'promoteChatMember',
      params: {
        user_id: userId,
        can_post_messages: canPostMessages,
        can_edit_messages: canEditMessages,
        can_delete_messages: canDeleteMessages,
        can_restrict_members: canRestrictMembers,
        can_promote_members: canPromoteMembers,
        can_change_info: canChangeInfo,
        can_invite_users: canInviteUsers,
        can_pin_messages: canPinMessages,
      },
    }),
  ];
});

/**
 * @category Props
 */
export type SetChatAdministratorCustomTitleProps = {
  /** Unique identifier of the target user */
  userId: number;
  /** New custom title for the administrator; 0-16 characters, emoji are not allowed */
  customTitle: string;
};

/**
 * Set a custom title for an administrator in a supergroup promoted by the bot.
 * @category Component
 * @props {@link SetChatAdministratorCustomTitleProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#setchatadministratorcustomtitle).
 */
export const SetChatAdministratorCustomTitle: TelegramComponent<
  SetChatAdministratorCustomTitleProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function SetChatAdministratorCustomTitle(node, path) {
  const { userId, customTitle } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'setChatAdministratorCustomTitle',
      params: {
        user_id: userId,
        custom_title: customTitle,
      },
    }),
  ];
});

/**
 * Set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members admin rights.
 * @category Component
 * @props {@link ChatPromotionProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#setchatpermissions).
 */
export const SetChatPermissions: TelegramComponent<
  ChatPromotionProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function SetChatPermissions(node, path) {
  const {
    canSendMessages,
    canSendMediaMessages,
    canSendPolls,
    canSendOtherMessages,
    canAddWebPagePreviews,
    canChangeInfo,
    canInviteUsers,
    canPinMessages,
  } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'setChatPermissions',
      params: {
        permisions: {
          can_send_messages: canSendMessages,
          can_send_media_messages: canSendMediaMessages,
          can_send_polls: canSendPolls,
          can_send_other_messages: canSendOtherMessages,
          can_add_web_page_previews: canAddWebPagePreviews,
          can_change_info: canChangeInfo,
          can_invite_users: canInviteUsers,
          can_pin_messages: canPinMessages,
        },
      },
    }),
  ];
});

/**
 * @category Props
 */
export type SetChatPhotoProps = {
  /** The file content data. */
  fileData: Buffer | NodeJS.ReadableStream;
  /** Metadata about the uploading `fileData` if needed (while using Buffer). */
  fileInfo?: UploadingFileInfo;
};

/**
 * Set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
 * @category Component
 * @props {@link SetChatPhotoProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#setchatphoto).
 */
export const SetChatPhoto: TelegramComponent<
  SetChatPhotoProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function SetChatPhoto(node, path) {
  const { fileData, fileInfo } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'setChatPhoto',
      params: {
        photo: undefined,
      },
      uploadingFiles: [
        { fieldName: 'photo', fileData, fileInfo, assetTag: undefined },
      ],
    }),
  ];
});

/**
 * Delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
 * @category Component
 * @props `{}`
 * @guides Check official [reference](https://core.telegram.org/bots/api#deletechatphoto).
 */
export const DeleteChatPhoto: TelegramComponent<
  {},
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function DeleteChatPhoto(node, path) {
  return [
    makeUnitSegment(node, path, {
      method: 'deleteChatPhoto',
      params: {},
    }),
  ];
});

/**
 * @category Props
 */
export type SetChatTitleProps = {
  /** New chat title, 1-255 characters */
  title: string;
};

/**
 *  Change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
 * @category Component
 * @props {@link SetChatTitleProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#setchattitle).
 */
export const SetChatTitle: TelegramComponent<
  SetChatTitleProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function SetChatTitle(node, path) {
  const { title } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'setChatTitle',
      params: { title },
    }),
  ];
});

/**
 * @category Props
 */
export type SetChatDescriptionProps = {
  /** New chat title, 1-255 characters */
  description: string;
};

/**
 * Change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
 * @category Component
 * @props {@link SetChatDescriptionProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#setchatdescription).
 */
export const SetChatDescription: TelegramComponent<
  SetChatDescriptionProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function SetChatDescription(node, path) {
  const { description } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'setChatDescription',
      params: { description },
    }),
  ];
});

/**
 * @category Props
 */
export type PinChatMessageProps = {
  /** Identifier of a message to pin */
  messageId: number;
  /** Pass True, if it is not necessary to send a notification to all chat members about the new pinned message. Notifications are always disabled in channels. */
  disableNotification?: boolean;
};

/**
 * Pin a message in a group, a supergroup, or a channel. The bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in the supergroup or 'can_edit_messages' admin right in the channel.
 * @category Component
 * @props {@link PinChatMessageProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#pinchatmessage).
 */
export const PinChatMessage: TelegramComponent<
  PinChatMessageProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function PinChatMessage(node, path) {
  const { messageId, disableNotification } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'pinChatMessage',
      params: {
        message_id: messageId,
        disable_notification: disableNotification,
      },
    }),
  ];
});

/**
 * Unpin a message in a group, a supergroup, or a channel. The bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in the supergroup or 'can_edit_messages' admin right in the channel.
 * @category Component
 * @props `{}`
 * @guides Check official [reference](https://core.telegram.org/bots/api#unpinchatmessage).
 */
export const UnpinChatMessage: TelegramComponent<
  {},
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function UnpinChatMessage(node, path) {
  return [
    makeUnitSegment(node, path, {
      method: 'unpinChatMessage',
      params: {},
    }),
  ];
});

/**
 * Leave a group, supergroup or channel.
 * @category Component
 * @props `{}`
 * @guides Check official [reference](https://core.telegram.org/bots/api#leavechat).
 */
export const LeaveChat: TelegramComponent<
  {},
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function LeaveChat(node, path) {
  return [
    makeUnitSegment(node, path, {
      method: 'leaveChat',
      params: {},
    }),
  ];
});

/**
 * @category Props
 */
export type SetChatStickerSetProps = {
  /** Name of the sticker set to be set as the group sticker set */
  stickerSetName: string;
};

/**
 * Change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
 * @category Component
 * @props {@link SetChatStickerSetProps}
 * @guides Check official [reference](https://core.telegram.org/bots/api#setchatstickerset).
 */
export const SetChatStickerSet: TelegramComponent<
  SetChatStickerSetProps,
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function SetChatStickerSet(node, path) {
  const { stickerSetName } = node.props;

  return [
    makeUnitSegment(node, path, {
      method: 'setChatStickerSet',
      params: { sticker_set_name: stickerSetName },
    }),
  ];
});

/**
 * Leave a group, supergroup or channel.
 * @category Component
 * @props `{}`
 * @guides Check official [reference](https://core.telegram.org/bots/api#deletechatstickerset).
 */
export const DeleteChatStickerSet: TelegramComponent<
  {},
  UnitSegment<TelegramSegmentValue>
> = makeTelegramComponent(function DeleteChatStickerSet(node, path) {
  return [
    makeUnitSegment(node, path, {
      method: 'deleteChatStickerSet',
      params: {},
    }),
  ];
});
