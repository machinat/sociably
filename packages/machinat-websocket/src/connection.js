// @flow
import type { ConnectionId } from './types';

export default class Connection {
  id: ConnectionId;
  serverId: string;
  socketId: string;
  tags: null | string[];

  constructor(
    serverId: string,
    socketId: string,
    id: ConnectionId,
    tags: null | string[]
  ) {
    this.serverId = serverId;
    this.socketId = socketId;
    this.id = id;
    this.tags = tags;
  }
}
