// @flow
import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import { WEBSOCKET } from './constant';

export class ConnectionChannel implements MachinatChannel {
  platform = WEBSOCKET;
  type = 'connection';
  serverId: string;
  connectionId: string;

  constructor(serverId: string, connectionId: string) {
    this.serverId = serverId;
    this.connectionId = connectionId;
  }

  get id() {
    return this.connectionId;
  }

  get uid() {
    return `${WEBSOCKET}.conn.${this.serverId}.${this.connectionId}`;
  }
}

export class UserChannel implements MachinatChannel {
  platform = WEBSOCKET;
  type = 'user';
  user: MachinatUser;

  constructor(user: MachinatUser) {
    this.user = user;
  }

  get userUId() {
    return this.user.uid;
  }

  get uid() {
    const { uid } = (this.user: MachinatUser);
    return `${WEBSOCKET}.user.${uid}`;
  }
}

export class TopicChannel implements MachinatChannel {
  platform = WEBSOCKET;
  type = 'topic';
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  get uid() {
    return `${WEBSOCKET}.topic.${this.name}`;
  }
}
