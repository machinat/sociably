// @flow
/* eslint-disable camelcase */
import type { MachinatThread } from 'machinat-base/types';
import type { Recepient } from './types';

export default class MessengerThread implements MachinatThread {
  platform: string;
  type: string;
  id: ?string;
  phone_number: ?string;
  name: ?{| first_name: string, last_name: string |};
  user_ref: ?string;

  constructor(recepient: Recepient) {
    Object.defineProperties(this, {
      platform: {
        value: 'messenger',
      },
      type: {
        value: 'user',
      },
      id: {
        enumerable: true,
        value: recepient.id || undefined,
      },
      phone_number: {
        enumerable: true,
        value: recepient.phone_number || undefined,
      },
      name: {
        enumerable: true,
        value: recepient.name || undefined,
      },
      user_ref: {
        enumerable: true,
        value: recepient.user_ref || undefined,
      },
    });
  }

  get identifier() {
    // prettier-ignore
    return this.id
      ? `id:${this.id}`
      : this.user_ref
      ? `user_ref:${this.user_ref}`
      : this.phone_number
      ? `phone_number:${this.phone_number}`
      : JSON.stringify(this);
  }
}
