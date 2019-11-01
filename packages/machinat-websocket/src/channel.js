// @flow
import type { MachinatUser, MachinatChannel } from 'machinat/types';
import type Connection from './connection';
import { WEBSOCKET } from './constant';

export class TopicScopeChannel implements MachinatChannel {
  platform: 'websocket';
  type: 'topic';
  name: string;
  id: void | string;

  constructor(name?: string, id?: string) {
    this.platform = 'websocket';
    this.type = 'topic';
    this.name = name || 'default';
    this.id = id;
  }

  get subtype() {
    return this.name;
  }

  get uid() {
    return `${WEBSOCKET}:topic:${this.name}:${this.id || '*'}`;
  }
}

export class UserScopeChannel implements MachinatChannel {
  platform: 'websocket';
  type: 'user';
  user: MachinatUser;

  constructor(user: MachinatUser) {
    this.platform = 'websocket';
    this.type = 'user';
    this.user = user;
  }

  get subtype() {
    return (this.user: MachinatUser).platform;
  }

  get id() {
    return (this.user: MachinatUser).id;
  }

  get uid() {
    const { platform, id } = (this.user: MachinatUser);
    return `${WEBSOCKET}:user:${platform || '*'}:${id}`;
  }
}

export class ConnectionChannel implements MachinatChannel {
  platform: 'websocket';
  type: 'connection';
  connection: Connection;

  constructor(connection: Connection) {
    this.platform = 'websocket';
    this.type = 'connection';
    this.connection = connection;
  }

  get id() {
    return this.connection.id;
  }

  get uid() {
    return `${WEBSOCKET}:connection:*:${this.connection.id}`;
  }
}
