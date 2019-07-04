// @flow
import type { MachinatChannel } from 'machinat-base/types';
import type { Session, SessionManager } from '../types';

class InMemorySession implements Session {
  _values: Map<string, any>;

  constructor() {
    this._values = new Map();
  }

  get(key: string) {
    const value = this._values.get(key);
    return Promise.resolve(value);
  }

  set(key: string, value: any) {
    this._values.set(key, value);
    return Promise.resolve();
  }

  delete(key: string) {
    const success = this._values.delete(key);
    return Promise.resolve(success);
  }

  clear() {
    this._values.clear();
    return Promise.resolve();
  }
}

class InMemorySessionManager implements SessionManager {
  _sessions: Map<string, InMemorySession>;

  constructor() {
    this._sessions = new Map();
  }

  getSession(channel: MachinatChannel) {
    const { uid } = channel;
    const session = this._sessions.get(uid);
    if (session !== undefined) {
      return session;
    }

    const newSession = new InMemorySession();
    this._sessions.set(uid, newSession);
    return newSession;
  }

  attachSession() {
    return (frame: Object) => ({
      ...frame,
      session: this.getSession(frame.channel),
    });
  }
}

export default InMemorySessionManager;
