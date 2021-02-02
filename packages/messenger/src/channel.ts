import crypto from 'crypto';
import type { MachinatChannel } from '@machinat/core/types';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import { MESSENGER, MessengerChatType } from './constant';
import MessengerUser from './user';
import type { MessengerTarget, MessengerThreadType } from './types';

type MessengerChatValue = {
  pageId: string;
  type: MessengerChatType;
  target: MessengerTarget;
};

class MessengerChat
  implements MachinatChannel, Marshallable<MessengerChatValue> {
  static Type = MessengerChatType;

  static fromUser(user: MessengerUser): MessengerChat {
    return new MessengerChat(user.pageId, { id: user.psid });
  }

  static fromJSONValue(value: MessengerChatValue): MessengerChat {
    const { pageId, target, type } = value;
    return new MessengerChat(pageId, target, type);
  }

  pageId: string;
  type: MessengerChatType;
  private _target: MessengerTarget;

  platform = MESSENGER;

  constructor(
    pageId: number | string,
    target: MessengerTarget,
    type: MessengerChatType = MessengerChatType.UserToPage
  ) {
    this.pageId = String(pageId);
    this.type = type;
    this._target = target;
  }

  get targetType(): string {
    const { _target: target } = this;

    return this.type !== MessengerChatType.UserToPage || 'id' in target
      ? 'psid'
      : 'user_ref' in target
      ? 'user_ref'
      : 'phone_number' in target
      ? 'phone_number'
      : 'post_id' in target
      ? 'post_id'
      : 'comment_id' in target
      ? 'comment_id'
      : 'unknown';
  }

  get identifier(): string {
    const target = this._target as Record<string, undefined | string>;

    return (
      target.id ||
      target.user_ref ||
      target.post_id ||
      target.comment_id ||
      (target.phone_number
        ? // hash phone_number for private data concern
          crypto.createHash('sha1').update(target.phone_number).digest('base64')
        : '*')
    );
  }

  get uid(): string {
    return `messenger.${this.pageId}.${this.targetType}.${this.identifier}`;
  }

  get target(): null | MessengerTarget {
    return this.type === MessengerChatType.UserToPage ? this._target : null;
  }

  get threadType(): MessengerThreadType {
    return this.type === MessengerChatType.Group
      ? 'GROUP'
      : this.type === MessengerChatType.UserToUser
      ? 'USER_TO_USER'
      : 'USER_TO_PAGE';
  }

  toJSONValue(): MessengerChatValue {
    const { pageId, _target: target, type } = this;
    return { pageId, target, type };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

export default MessengerChat;
