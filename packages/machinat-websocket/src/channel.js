// @flow
import type { MachinatUser } from 'machinat/types';
import type Connection from './connection';
import { WEBSOCKET } from './constant';
import type { TopicScope, UserScope, ConnectionScope } from './types';

const TopicScopeProto = {
  platform: 'websocket',
  type: 'topic',
  get subtype() {
    return this.name;
  },
  get uid() {
    return `${WEBSOCKET}:topic:${this.name}:${this.id || '*'}`;
  },
};

export const topicScope = (name?: string, id?: string): TopicScope => {
  const scope: TopicScope = Object.create(TopicScopeProto);
  scope.name = name || 'default';
  scope.id = id;
  return scope;
};

const UserScopeProto = {
  platform: 'websocket',
  type: 'user',
  get subtype() {
    return (this.user: MachinatUser).platform;
  },
  get id() {
    return (this.user: MachinatUser).id;
  },
  get uid() {
    const { platform, id } = (this.user: MachinatUser);
    return `${WEBSOCKET}:user:${platform || '*'}:${id}`;
  },
};

export const userScope = (user: MachinatUser): UserScope => {
  const scope: UserScope = Object.create(UserScopeProto);
  scope.user = user;
  return scope;
};

const ConnectionScopeProto = {
  platform: 'websocket',
  type: 'connection',
  get id() {
    return (this.connection: Connection).id;
  },
  get uid() {
    return `${WEBSOCKET}:connection:*:${this.connection.id}`;
  },
};

export const connectionScope = (connection: Connection): ConnectionScope => {
  const scope: ConnectionScope = Object.create(ConnectionScopeProto);
  scope.connection = connection;
  return scope;
};
