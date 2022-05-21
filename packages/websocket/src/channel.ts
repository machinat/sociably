import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import { WEBSOCKET } from './constant';
import type { ConnectionTarget, UserTarget, TopicTarget } from './types';

type ConnectionValue = {
  server: string;
  id: string;
};

export class WebSocketConnection
  implements
    MachinatChannel,
    ConnectionTarget,
    MarshallableInstance<ConnectionValue>
{
  static typeName = 'WsConnection';

  static fromJSONValue({ id, server }: ConnectionValue): WebSocketConnection {
    return new WebSocketConnection(server, id);
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
    return `ws.conn.${this.serverId}.${this.id}`;
  }

  toJSONValue(): ConnectionValue {
    const { serverId, id } = this;
    return { server: serverId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebSocketConnection.typeName;
  }
}

type UserChannelValue = {
  user: string;
};

export class WebSocketUserChannel
  implements
    MachinatChannel,
    UserTarget,
    MarshallableInstance<UserChannelValue>
{
  static typeName = 'WsUserCh';

  static fromJSONValue({ user }: UserChannelValue): WebSocketUserChannel {
    return new WebSocketUserChannel(user);
  }

  platform = WEBSOCKET;
  type = 'user' as const;

  userUid: string;

  constructor(userUid: string) {
    this.userUid = userUid;
  }

  get uid(): string {
    return `ws.user.${this.userUid}`;
  }

  toJSONValue(): UserChannelValue {
    return { user: this.userUid };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebSocketUserChannel.typeName;
  }
}

type TopicValue = {
  name: string;
};

export class WebSocketTopicChannel
  implements MachinatChannel, TopicTarget, MarshallableInstance<TopicValue>
{
  static typeName = 'WsTopicCh';

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
    return `ws.topic.${this.name}`;
  }

  toJSONValue(): TopicValue {
    return { name: this.name };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebSocketTopicChannel.typeName;
  }
}
