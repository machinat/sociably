// @flow
import type { MachinatChannel } from 'machinat-base/types';
import type { Session, SessionStore } from '../types';

class InMemorySession implements Session {
  _states: Map<string, any>;

  constructor() {
    this._states = new Map();
  }

  get(key: string) {
    const state = this._states.get(key);
    return Promise.resolve(state);
  }

  set(key: string, state: any) {
    this._states.set(key, state);
    return Promise.resolve();
  }

  update(key: string, update: any => any) {
    const state = this._states.get(key);

    const newValues = update(state);
    if (newValues === undefined) {
      this.delete(key);
    } else {
      this._states.set(key, newValues);
    }

    return Promise.resolve();
  }

  delete(key: string) {
    const success = this._states.delete(key);
    return Promise.resolve(success);
  }

  clear() {
    this._states.clear();
    return Promise.resolve();
  }
}

class InMemorySessionStore implements SessionStore {
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
}

export default InMemorySessionStore;
