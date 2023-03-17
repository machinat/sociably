import type { SociablyThread, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import type {
  ConnectionTarget,
  UserTarget,
  TopicTarget,
} from '@sociably/websocket';
import { WEBVIEW } from './constant';

type ConnectionValue = {
  server: string;
  id: string;
};

export class WebviewConnection
  implements
    SociablyThread,
    ConnectionTarget,
    MarshallableInstance<ConnectionValue>
{
  static typeName = 'WebviewConn';

  static fromJSONValue({ id, server }: ConnectionValue): WebviewConnection {
    return new WebviewConnection(server, id);
  }

  platform = WEBVIEW;
  type = 'connection' as const;

  serverId: string;
  id: string;

  constructor(serverId: string, id: string) {
    this.serverId = serverId;
    this.id = id;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: WEBVIEW,
      scopeId: this.serverId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${WEBVIEW}.conn.${this.serverId}.${this.id}`;
  }

  toJSONValue(): ConnectionValue {
    const { serverId, id } = this;
    return { server: serverId, id };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebviewConnection.typeName;
  }
}

type UserThreadValue = {
  user: string;
};

export class WebviewUserThread
  implements SociablyThread, UserTarget, MarshallableInstance<UserThreadValue>
{
  static typeName = 'WebviewUserCh';

  static fromJSONValue({ user }: UserThreadValue): WebviewUserThread {
    return new WebviewUserThread(user);
  }

  platform = WEBVIEW;
  type = 'user' as const;

  userUid: string;

  constructor(userUid: string) {
    this.userUid = userUid;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: WEBVIEW,
      scopeId: 'user',
      id: this.userUid,
    };
  }

  get uid(): string {
    return `${WEBVIEW}.user.${this.userUid}`;
  }

  toJSONValue(): UserThreadValue {
    return { user: this.userUid };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebviewUserThread.typeName;
  }
}

type TopicValue = {
  name: string;
};

export class WebviewTopicThread
  implements SociablyThread, TopicTarget, MarshallableInstance<TopicValue>
{
  static typeName = 'WebviewTopicCh';

  static fromJSONValue({ name }: TopicValue): WebviewTopicThread {
    return new WebviewTopicThread(name);
  }

  platform = WEBVIEW;
  type = 'topic' as const;
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      platform: WEBVIEW,
      scopeId: 'topic',
      id: this.name,
    };
  }

  get uid(): string {
    return `${WEBVIEW}.topic.${this.name}`;
  }

  toJSONValue(): TopicValue {
    return { name: this.name };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebviewTopicThread.typeName;
  }
}
