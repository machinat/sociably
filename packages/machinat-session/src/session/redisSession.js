// @flow
import type { MachinatChannel } from 'machinat-base/types';
import type { Session, SessionManager } from '../types';

class RedisSession implements Session {
  constructor() {}

  get(key: string) {
    return Promise.resolve(value);
  }

  set(key: string, value: any) {
    return Promise.resolve();
  }

  delete(key: string) {
    return Promise.resolve(true);
  }

  clear() {
    return Promise.resolve();
  }
}

class RedisSessionManager implements SessionManager {
  constructor() {}

  getSession(channel: MachinatChannel) {}
}

export default RedisSessionManager;
