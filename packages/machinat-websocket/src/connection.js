// @flow
import type { ConnectionId } from './types';

export default class Connection {
  id: ConnectionId;
  serverId: string;
  socketId: string;
  expiredAt: null | Date;

  constructor(
    serverId: string,
    socketId: string,
    id: ConnectionId,
    expiredAt: null | Date
  ) {
    this.serverId = serverId;
    this.socketId = socketId;
    this.id = id;
    this.expiredAt = expiredAt;
  }
}
