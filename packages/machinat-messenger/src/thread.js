// @flow
/* eslint-disable camelcase */
import type { MachinatThread } from 'machinat-base/types';
import type { Recepient } from './types';

const MESSNEGER = 'messenger';

class MessengerThread implements MachinatThread {
  platform: string;
  type: string;
  recepient: Recepient;
  pageId: ?string;

  constructor(recepient: Recepient, pageId?: string) {
    this.recepient = recepient;
    this.pageId = pageId;
  }

  uid() {
    const { recepient } = this;
    const pagePrefix = `${MESSNEGER}:${this.pageId || ''}`;
    // prettier-ignore
    return recepient.id
      ? `${pagePrefix}:id:${recepient.id}`
      : recepient.user_ref
      ? `${pagePrefix}:user_ref:${recepient.user_ref}`
      : recepient.phone_number
      ? `${pagePrefix}:phone_number:${recepient.phone_number}`
      : JSON.stringify(recepient);
  }
}

Object.defineProperties(MessengerThread.prototype, {
  platform: {
    value: 'messenger',
  },
  type: {
    value: 'user',
  },
});

export default MessengerThread;
