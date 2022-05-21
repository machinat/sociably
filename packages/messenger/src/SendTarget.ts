import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { MESSENGER } from './constant';
import type { MessengerTarget } from './types';

type SendTargetValue = {
  page: string;
  target: MessengerTarget;
};

class FacebookSendTarget
  implements MachinatChannel, MarshallableInstance<SendTargetValue>
{
  static typeName = 'FbSendTarget';
  static fromJSONValue(value: SendTargetValue): FacebookSendTarget {
    const { page, target } = value;
    return new FacebookSendTarget(page, target);
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
      ? 'psid'
      : 'user_ref' in target
      ? 'user_ref'
      : 'post_id' in target
      ? 'post'
      : 'comment_id' in target
      ? 'comment'
      : 'unknown';
  }

  get identifier(): string {
    const target = this.target as Record<string, undefined | string>;

    return (
      target.id || target.user_ref || target.post_id || target.comment_id || '-'
    );
  }

  get uid(): string {
    return `fb.${this.pageId}.${this.identifier}`;
  }

  toJSONValue(): SendTargetValue {
    const { pageId, target } = this;
    return { page: pageId, target };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return FacebookSendTarget.typeName;
  }
}

export default FacebookSendTarget;
