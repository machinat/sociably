import type { SociablyThread, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import { WEBSOCKET } from './constant';
import type { ConnectionTarget } from './types';

type ConnectionValue = {
  server: string;
  id: string;
};

class WebSocketConnection
  implements
    SociablyThread,
    ConnectionTarget,
    MarshallableInstance<ConnectionValue>
{
  static typeName = 'WebSocketConnection';

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
    return `${WEBSOCKET}.${this.serverId}.${this.id}`;
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

export default WebSocketConnection;
