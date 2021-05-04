import crypto from 'crypto';
import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { MESSENGER, MessengerChatType } from './constant';
import MessengerUser from './user';
import type { MessengerTarget, MessengerThreadType } from './types';

type MessengerChatValue = {
  pageId: number;
  type: MessengerChatType;
  target: MessengerTarget;
};

class MessengerChat
  implements MachinatChannel, MarshallableInstance<MessengerChatValue> {
  static typeName = 'MessengerChat';

  static fromUser(user: MessengerUser): MessengerChat {
    return new MessengerChat(user.pageId, { id: user.psid });
  }

  static fromJSONValue(value: MessengerChatValue): MessengerChat {
    const { pageId, target, type } = value;
    return new MessengerChat(pageId, target, type);
  }

  pageId: number;
  private _type: MessengerChatType;
  private _target: MessengerTarget;

  platform = MESSENGER;

  constructor(
    pageId: number,
    target: MessengerTarget,
    type: MessengerChatType = MessengerChatType.UserToPage
  ) {
    this.pageId = pageId;
    this._type = type;
    this._target = target;
  }

  get targetType(): string {
    const { _target: target } = this;

    return this._type !== MessengerChatType.UserToPage || 'id' in target
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
    return this._type === MessengerChatType.UserToPage ? this._target : null;
  }

  get threadType(): MessengerThreadType {
    return this._type === MessengerChatType.Group
      ? 'GROUP'
      : this._type === MessengerChatType.UserToUser
      ? 'USER_TO_USER'
      : 'USER_TO_PAGE';
  }

  toJSONValue(): MessengerChatValue {
    const { pageId, _target: target, _type: type } = this;
    return { pageId, target, type };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return MessengerChat.typeName;
  }
}

export default MessengerChat;
