// @flow
/* eslint-disable camelcase */
import crypto from 'crypto';
import type { MachinatThread } from 'machinat-base/types';

import type { MessnegerSource } from './types';

class MessengerThread implements MachinatThread {
  uid: string;
  source: MessnegerSource;
  pageId: ?string;

  platform = 'messenger';
  type = 'chat';
  subtype = 'user';
  allowPause = true;

  constructor(source: MessnegerSource, pageId?: string) {
    this.source = source;
    this.pageId = pageId;

    this.uid = `messenger:${this.pageId || 'default'}:${
      source.id
        ? `user:${source.id}`
        : source.user_ref
        ? `user_ref:${source.user_ref}`
        : source.phone_number
        ? `phone_number:${crypto
            .createHash('sha1')
            .update(source.phone_number)
            .digest('base64')}`
        : 'chat:*'
    }`;
  }
}

export default MessengerThread;
