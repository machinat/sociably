import type { SociablyChannel, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { WEBSOCKET } from './constant';
import type { ConnectionTarget, UserTarget, TopicTarget } from './types';

type ConnectionValue = {
  server: string;
  id: string;
};

export class WebSocketConnection
  implements
    SociablyChannel,
    ConnectionTarget,
    MarshallableInstance<ConnectionValue>
{
  static typeName = 'WebSocketConn';

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

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: WEBSOCKET,
      scopeId: this.serverId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${WEBSOCKET}.conn.${this.serverId}.${this.id}`;
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
    SociablyChannel,
    UserTarget,
    MarshallableInstance<UserChannelValue>
{
  static typeName = 'WebSocketUserCh';

  static fromJSONValue({ user }: UserChannelValue): WebSocketUserChannel {
    return new WebSocketUserChannel(user);
  }

  platform = WEBSOCKET;
  type = 'user' as const;

  userUid: string;

  constructor(userUid: string) {
    this.userUid = userUid;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: WEBSOCKET,
      scopeId: 'user',
      id: this.userUid,
    };
  }

  get uid(): string {
    return `${WEBSOCKET}.user.${this.userUid}`;
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
  implements SociablyChannel, TopicTarget, MarshallableInstance<TopicValue>
{
  static typeName = 'WebSocketTopicCh';

  static fromJSONValue({ name }: TopicValue): WebSocketTopicChannel {
    return new WebSocketTopicChannel(name);
  }

  platform = WEBSOCKET;
  type = 'topic' as const;
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: WEBSOCKET,
      scopeId: 'topic',
      id: this.name,
    };
  }

  get uid(): string {
    return `${WEBSOCKET}.topic.${this.name}`;
  }

  toJSONValue(): TopicValue {
    return { name: this.name };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebSocketTopicChannel.typeName;
  }
}
