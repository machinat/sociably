// @flow
import type Distributor from '../distributor';
import type {
  ThreadUid,
  SocketId,
  WebEventJob,
  ConnectionInfo,
  SocketBroker,
} from '../types';

export default class LocalOnlyBroker implements SocketBroker {
  distributor: Distributor;

  constructor(distributor: Distributor) {
    this.distributor = distributor;
  }

  broadcast(job: WebEventJob) {
    return this.distributor.broadcast(job);
  }

  addConnection(socketId: SocketId, uid: ThreadUid, info: ConnectionInfo) {
    return this.distributor.addLocalConnection(socketId, uid, info);
  }

  removeConnection(socketId: SocketId, uid: ThreadUid) {
    return this.distributor.removeLocalConnection(socketId, uid);
  }
}
