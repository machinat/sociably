import type { MachinatChannel } from '@machinat/core';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import { WEBSOCKET } from './constant';
import type { ConnectionTarget, UserTarget, TopicTarget } from './types';

type ConnectionValue = {
  serverId: string;
  id: string;
};

export class WebSocketConnection
  implements MachinatChannel, ConnectionTarget, Marshallable<ConnectionValue> {
  static fromJSONValue({ id, serverId }: ConnectionValue): WebSocketConnection {
    return new WebSocketConnection(serverId, id);
  }

  platform = WEBSOCKET;
  type = 'connection' as const;

  serverId: string;
  id: string;

  constructor(serverId: string, id: string) {
    this.serverId = serverId;
    this.id = id;
  }

  get uid(): string {
    return `${WEBSOCKET}.conn.${this.serverId}.${this.id}`;
  }

  toJSONValue(): ConnectionValue {
    const { serverId, id } = this;
    return { serverId, id };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

type UserChannelValue = {
  userUid: string;
};

export class WebSocketUserChannel
  implements MachinatChannel, UserTarget, Marshallable<UserChannelValue> {
  static fromJSONValue({ userUid }: UserChannelValue): WebSocketUserChannel {
    return new WebSocketUserChannel(userUid);
  }

  platform = WEBSOCKET;
  type = 'user' as const;

  userUid: string;

  constructor(userUid: string) {
    this.userUid = userUid;
  }

  get uid(): string {
    return `${WEBSOCKET}.user.${this.userUid}`;
  }

  toJSONValue(): UserChannelValue {
    return { userUid: this.userUid };
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
