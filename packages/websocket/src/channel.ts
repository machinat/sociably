import type { MachinatChannel } from '@machinat/core/types';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import { WEBSOCKET } from './constant';
import type { ConnectionTarget, UserTarget, TopicTarget } from './types';

type ConnectionValue = {
  serverId: string;
  connectionId: string;
};

export class WebSocketConnection
  implements MachinatChannel, ConnectionTarget, Marshallable<ConnectionValue> {
  static fromJSONValue(value: ConnectionValue): WebSocketConnection {
    return new WebSocketConnection(value.serverId, value.connectionId);
  }

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

  toJSONValue(): ConnectionValue {
    const { serverId, connectionId } = this;
    return { serverId, connectionId };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

type UserChannelValue = {
  userUId: string;
};

export class WebSocketUserChannel
  implements MachinatChannel, UserTarget, Marshallable<UserChannelValue> {
  static fromJSONValue({ userUId }: UserChannelValue): WebSocketUserChannel {
    return new WebSocketUserChannel(userUId);
  }

  platform = WEBSOCKET;
  type = 'user' as const;

  userUId: string;

  constructor(userUId: string) {
    this.userUId = userUId;
  }

  get uid(): string {
    return `${WEBSOCKET}.user.${this.userUId}`;
  }

  toJSONValue(): UserChannelValue {
    return { userUId: this.userUId };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

type TopicValue = {
  name: string;
};

export class WebSocketTopicChannel
  implements MachinatChannel, TopicTarget, Marshallable<TopicValue> {
  static fromJSONValue({ name }: TopicValue): WebSocketTopicChannel {
    return new WebSocketTopicChannel(name);
  }

  platform = WEBSOCKET;
  type = 'topic' as const;
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  get uid(): string {
    return `${WEBSOCKET}.topic.${this.name}`;
  }

  toJSONValue(): TopicValue {
    return { name: this.name };
  }

  typeName(): string {
    return this.constructor.name;
  }
}
