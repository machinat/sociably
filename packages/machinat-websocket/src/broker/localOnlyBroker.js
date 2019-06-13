// @flow
import type Distributor from '../distributor';
import type {
  ChannelUid,
  SocketId,
  WebSocketJob,
  ConnectionInfo,
  SocketBroker,
} from '../types';

export default class LocalOnlyBroker implements SocketBroker {
  distributor: Distributor;

  constructor(distributor: Distributor) {
    this.distributor = distributor;
  }

  broadcast(job: WebSocketJob) {
    return this.distributor.broadcastLocal(job);
  }

  linkConnection(uid: ChannelUid, socketId: SocketId, info: ConnectionInfo) {
    return this.distributor.linkLocalConnection(socketId, uid, info);
  }

  unlinkConnection(uid: ChannelUid, socketId: SocketId, reason: string) {
    return this.distributor.unlinkLocalConnection(socketId, uid, reason);
  }
}
