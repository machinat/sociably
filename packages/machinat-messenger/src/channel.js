// @flow
/* eslint-disable camelcase */
import crypto from 'crypto';
import type { MachinatChannel } from 'machinat/types';
import { MESSENGER } from './constant';
import type {
  MessengerTarget,
  ExtensionContextPayload,
  MessengerThreadType,
} from './types';

class MessengerChannel implements MachinatChannel {
  pageId: string | number;
  threadType: MessengerThreadType;
  _target: MessengerTarget;

  platform = MESSENGER;

  static fromExtensionContext(ctx: ExtensionContextPayload) {
    return new MessengerChannel(ctx.page_id, { id: ctx.tid }, ctx.thread_type);
  }

  constructor(
    pageId: string | number,
    target: MessengerTarget,
    threadType: MessengerThreadType = 'USER_TO_PAGE'
  ) {
    this.pageId = pageId;
    this.threadType = threadType;
    this._target = target;
  }

  get type() {
    return this.threadType;
  }

  get subtype() {
    return this.targetType;
  }

  get targetType() {
    return this.threadType !== 'USER_TO_PAGE' || this._target.id
      ? 'psid'
      : this._target.user_ref
      ? 'user_ref'
      : this._target.phone_number
      ? 'phone_number'
      : this._target.post_id
      ? 'post_id'
      : this._target.comment_id
      ? 'comment_id'
      : '';
  }

  get identifier() {
    const { _target: target } = this;

    return (
      target.id ||
      target.user_ref ||
      target.post_id ||
      target.comment_id ||
      (target.phone_number
        ? crypto
            .createHash('sha1')
            .update(target.phone_number)
            .digest('base64')
        : '')
    );
  }

  get uid(): string {
    return `messenger:${this.pageId}:${this.targetType}:${this.identifier}`;
  }

  get sendable() {
    return this.threadType === 'USER_TO_PAGE';
  }

  get target(): null | MessengerTarget {
    return this.sendable ? this._target : null;
  }
}

export default MessengerChannel;
