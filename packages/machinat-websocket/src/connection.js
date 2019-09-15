// @flow
import type { MachinatUser } from 'machinat/types';
import type { ConnectionId } from './types';

export default class Connection {
  id: ConnectionId;
  serverId: string;
  socketId: string;
  user: null | MachinatUser;
  tags: null | string[];

  constructor(
    serverId: string,
    socketId: string,
    id: ConnectionId,
    user: null | MachinatUser,
    tags: null | string[]
  ) {
    this.serverId = serverId;
    this.socketId = socketId;
    this.id = id;
    this.user = user;
    this.tags = tags;
  }
}
