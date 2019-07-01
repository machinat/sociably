// @flow
import type { MachinatChannel } from 'machinat-base/types';

export interface Session {
  get<Value>(key: string): Promise<void | Value>;
  set<Value>(key: string, value: Value): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface SessionManager {
  getSession(channel: MachinatChannel): Session;
}
