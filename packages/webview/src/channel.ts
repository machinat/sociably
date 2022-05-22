import type { MachinatChannel } from '@machinat/core';
import type { MarshallableInstance } from '@machinat/core/base/Marshaler';
import type {
  ConnectionTarget,
  UserTarget,
  TopicTarget,
} from '@machinat/websocket';
import { WEBVIEW } from './constant';

type ConnectionValue = {
  server: string;
  id: string;
};

export class WebviewConnection
  implements
    MachinatChannel,
    ConnectionTarget,
    MarshallableInstance<ConnectionValue>
{
  static typeName = 'WebviewConnection';

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

type UserChannelValue = {
  user: string;
};

export class WebviewUserChannel
  implements
    MachinatChannel,
    UserTarget,
    MarshallableInstance<UserChannelValue>
{
  static typeName = 'WebviewUserCh';

  static fromJSONValue({ user }: UserChannelValue): WebviewUserChannel {
    return new WebviewUserChannel(user);
  }

  platform = WEBVIEW;
  type = 'user' as const;

  userUid: string;

  constructor(userUid: string) {
    this.userUid = userUid;
  }

  get uid(): string {
    return `${WEBVIEW}.user.${this.userUid}`;
  }

  toJSONValue(): UserChannelValue {
    return { user: this.userUid };
  }

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebviewUserChannel.typeName;
  }
}

type TopicValue = {
  name: string;
};

export class WebviewTopicChannel
  implements MachinatChannel, TopicTarget, MarshallableInstance<TopicValue>
{
  static typeName = 'WebviewTopicCh';

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

  // eslint-disable-next-line class-methods-use-this
  typeName(): string {
    return WebviewTopicChannel.typeName;
  }
}
