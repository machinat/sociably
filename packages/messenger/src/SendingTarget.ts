import crypto from 'crypto';
import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { MESSENGER } from './constant';
import type { MessengerTarget } from './types';

type SendingTargetValue = {
  page: string;
  target: MessengerTarget;
};

class MessengerSendingTarget
  implements MachinatChannel, MarshallableInstance<SendingTargetValue>
{
  static typeName = 'MessengerSendingTarget';
  static fromJSONValue(value: SendingTargetValue): MessengerSendingTarget {
    const { page, target } = value;
    return new MessengerSendingTarget(page, target);
  }

  pageId: string;
  target: MessengerTarget;
  platform = MESSENGER;

  constructor(pageId: string, target: MessengerTarget) {
    this.pageId = pageId;
    this.target = target;
  }

  get type(): string {
    const { target } = this;

    return 'id' in target
      ? 'id'
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
    const target = this.target as Record<string, undefined | string>;

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
    return `messenger.${this.pageId}.${this.type}.${this.identifier}`;
  }

  toJSONValue(): SendingTargetValue {
    const { pageId, target } = this;
    return { page: pageId, target };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return MessengerSendingTarget.typeName;
  }
}

export default MessengerSendingTarget;
