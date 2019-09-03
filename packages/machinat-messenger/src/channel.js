// @flow
/* eslint-disable camelcase */
import crypto from 'crypto';
import type { MachinatChannel } from 'machinat/types';
import type { MessengerSource } from './types';
import { MESSENGER } from './constant';

class MessengerChannel implements MachinatChannel {
  uid: string;
  source: MessengerSource;
  pageId: string;

  platform = MESSENGER;
  type = 'chat';
  subtype = 'user';
  allowPause = true;

  constructor(source: MessengerSource, pageId: string) {
    this.source = source;
    this.pageId = pageId;

    this.uid = `messenger:${pageId}:${
      source.id
        ? `user:${source.id}`
        : source.user_ref
        ? `user_ref:${source.user_ref}`
        : source.phone_number
        ? // NOTE: uid is the identity of a channel and will likely to be used
          // and stored by 3rd-party plugins, so personal info should be hashed
          `phone_number:${crypto
            .createHash('sha1')
            .update(source.phone_number)
            .digest('base64')}`
        : 'chat:*'
    }`;
  }
}

export default MessengerChannel;
