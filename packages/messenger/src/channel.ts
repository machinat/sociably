import crypto from 'crypto';
import type { MachinatChannel } from '@machinat/core/types';
import { MESSENGER } from './constant';
import MessengerUser from './user';
import type { MessengerTarget, MessengerThreadType } from './types';

class MessengerChat implements MachinatChannel {
  pageId: string;
  type: MessengerThreadType;
  private _target: MessengerTarget;

  platform = MESSENGER;

  static fromUser(user: MessengerUser): MessengerChat {
    return new MessengerChat(user.pageId, { id: user.psid });
  }

  constructor(
    pageId: number | string,
    target: MessengerTarget,
    type: MessengerThreadType = 'USER_TO_PAGE'
  ) {
    this.pageId = String(pageId);
    this.type = type;
    this._target = target;
  }

  get targetType(): string {
    const { _target: target } = this;

    return this.type !== 'USER_TO_PAGE' || 'id' in target
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
    return this.type === 'USER_TO_PAGE' ? this._target : null;
  }
}

export default MessengerChat;
