import type { SociablyThread, UniqueOmniIdentifier } from '@sociably/core';
import type { MarshallableInstance } from '@sociably/core/base/Marshaler';
import type { ConnectionTarget } from '@sociably/websocket';
import { WEBVIEW } from './constant';

type ConnectionValue = {
  server: string;
  id: string;
};

class WebviewConnection
  implements
    SociablyThread,
    ConnectionTarget,
    MarshallableInstance<ConnectionValue>
{
  static typeName = 'WebviewConnection';
  static fromJSONValue({ id, server }: ConnectionValue): WebviewConnection {
    return new WebviewConnection(server, id);
  }

  readonly platform = WEBVIEW;
  readonly $$typeofThread = true;
  readonly type = 'connection';

  serverId: string;
  id: string;

  constructor(serverId: string, id: string) {
    this.serverId = serverId;
    this.id = id;
  }

  get uniqueIdentifier(): UniqueOmniIdentifier {
    return {
      $$typeof: ['thread'],
      platform: WEBVIEW,
      scopeId: this.serverId,
      id: this.id,
    };
  }

  get uid(): string {
    return `${WEBVIEW}.${this.serverId}.${this.id}`;
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

export default WebviewConnection;
