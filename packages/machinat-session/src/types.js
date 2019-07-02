// @flow
import type { EventFrame, MachinatChannel } from 'machinat-base/types';

export interface Session {
  get<Value>(key: string): Promise<void | Value>;
  set<Value>(key: string, value: Value): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface SessionManager {
  getSession(channel: MachinatChannel): Session;
  attachSession<F: EventFrame<any, any, any, any, any, any, any>>(): (
    frame: F
  ) => F & { session: Session };
}
