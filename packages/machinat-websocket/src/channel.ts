import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import { WEBSOCKET } from './constant';
import type { ConnectionTarget, UserTarget, TopicTarget } from './types';

export class ConnectionChannel implements MachinatChannel, ConnectionTarget {
  platform = WEBSOCKET;
  type = 'connection' as const;

  serverId: string;
  connectionId: string;

  constructor(serverId: string, connectionId: string) {
    this.serverId = serverId;
    this.connectionId = connectionId;
  }

  get id(): string {
    return this.connectionId;
  }

  get uid(): string {
    return `${WEBSOCKET}.conn.${this.serverId}.${this.connectionId}`;
  }
}

export class UserChannel implements MachinatChannel, UserTarget {
  platform = WEBSOCKET;
  type = 'user' as const;

  user: MachinatUser;

  constructor(user: MachinatUser) {
    this.user = user;
  }

  get userUId(): string {
    return this.user.uid;
  }

  get uid(): string {
    const { uid } = this.user as MachinatUser;
    return `${WEBSOCKET}.user.${uid}`;
  }
}

export class TopicChannel implements MachinatChannel, TopicTarget {
  platform = WEBSOCKET;
  type = 'topic' as const;
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  get uid(): string {
    return `${WEBSOCKET}.topic.${this.name}`;
  }
}
