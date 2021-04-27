import type { MachinatChannel } from '@machinat/core';
import type { CustomMarshallable } from '@machinat/core/base/Marshaler';
import type {
  ConnectionTarget,
  UserTarget,
  TopicTarget,
} from '@machinat/websocket';
import { WEBVIEW } from './constant';

type ConnectionValue = {
  serverId: string;
  id: string;
};

export class WebviewConnection
  implements
    MachinatChannel,
    ConnectionTarget,
    CustomMarshallable<ConnectionValue> {
  static fromJSONValue({ id, serverId }: ConnectionValue): WebviewConnection {
    return new WebviewConnection(serverId, id);
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
    return { serverId, id };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

type UserChannelValue = {
  userUid: string;
};

export class WebviewUserChannel
  implements MachinatChannel, UserTarget, CustomMarshallable<UserChannelValue> {
  static fromJSONValue({ userUid }: UserChannelValue): WebviewUserChannel {
    return new WebviewUserChannel(userUid);
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
    return { userUid: this.userUid };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

type TopicValue = {
  name: string;
};

export class WebviewTopicChannel
  implements MachinatChannel, TopicTarget, CustomMarshallable<TopicValue> {
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
