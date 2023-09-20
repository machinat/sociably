import { SociablyNode } from '@sociably/core';

export type MessageProps = {
  /**
   * Sends the message silently. Users will receive a notification with no
   * sound.
   */
  disableNotification?: boolean;
  /** If the message is a reply, ID of the original message */
  replyToMessageId?: number;
  /**
   * One {@link ReplyMarkup} element for an inline keyboard, custom reply
   * keyboard, instructions to remove reply keyboard or to force a reply from
   * the user.
   */
  replyMarkup?: SociablyNode;
};
