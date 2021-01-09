import type { MachinatChannel } from '@machinat/core/types';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import type {
  ConnectionTarget,
  UserTarget,
  TopicTarget,
} from '@machinat/websocket/types';
import { WEBVIEW } from './constant';

type ConnectionValue = {
  serverId: string;
  connectionId: string;
};

export class WebviewConnection
  implements MachinatChannel, ConnectionTarget, Marshallable<ConnectionValue> {
  static fromJSONValue(value: ConnectionValue): WebviewConnection {
    return new WebviewConnection(value.serverId, value.connectionId);
  }

  platform = WEBVIEW;
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
    return `${WEBVIEW}.conn.${this.serverId}.${this.connectionId}`;
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

export class WebviewUserChannel
  implements MachinatChannel, UserTarget, Marshallable<UserChannelValue> {
  static fromJSONValue({ userUId }: UserChannelValue): WebviewUserChannel {
    return new WebviewUserChannel(userUId);
  }

  platform = WEBVIEW;
  type = 'user' as const;

  userUId: string;

  constructor(userUId: string) {
    this.userUId = userUId;
  }

  get uid(): string {
    return `${WEBVIEW}.user.${this.userUId}`;
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

export class WebviewTopicChannel
  implements MachinatChannel, TopicTarget, Marshallable<TopicValue> {
  static fromJSONValue({ name }: TopicValue): WebviewTopicChannel {
    return new WebviewTopicChannel(name);
  }

  platform = WEBVIEW;
  type = 'topic' as const;
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  get uid(): string {
    return `${WEBVIEW}.topic.${this.name}`;
  }

  toJSONValue(): TopicValue {
    return { name: this.name };
  }

  typeName(): string {
    return this.constructor.name;
  }
}
