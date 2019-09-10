// @flow
import invariant from 'invariant';
import type { MachinatChannel, MachinatUser } from 'machinat/types';
import type { ConnectionId } from './types';
import { WEBSOCKET } from './constant';

export class WebSocketChannel implements MachinatChannel {
  type: string;
  subtype: void | string;
  id: void | string;
  uid: string;

  platform = WEBSOCKET;

  static fromUid(uid: string): null | WebSocketChannel {
    const [platform, type, subtype, id] = uid.split(':');
    if (platform !== WEBSOCKET || !type || !id) {
      return null;
    }

    const channel: WebSocketChannel = (Object.create(WebSocketChannel): any);
    channel.platform = WEBSOCKET;
    channel.type = type;
    channel.subtype = subtype === '*' ? undefined : subtype;
    channel.id = id;
    channel.uid = uid;
    return channel;
  }

  constructor(type: string, subtype?: string, id?: string) {
    invariant(
      type[0] !== '@',
      'channel type prefixed with "@" is reserved for framework'
    );

    this.id = id;
    this.type = type;
    this.subtype = subtype;
    this.uid = `websocket:${type}:${subtype || '*'}:${id || '*'}`;
  }
}

export const socketChannel = (socketId: string) => {
  const channel: any = Object.create(WebSocketChannel);
  channel.platform = WEBSOCKET;
  channel.type = '@socket';
  channel.id = socketId;
  channel.uid = `websocket:@socket:*:${socketId}`;
  return channel;
};

export const userChannel = (user: MachinatUser): WebSocketChannel => {
  const channel: any = Object.create(WebSocketChannel);
  channel.platform = WEBSOCKET;
  channel.type = '@user';
  channel.id = user.id;
  channel.subtype = user.platform;
  channel.uid = `websocket:@user:${user.platform}:${user.id}`;
  return channel;
};

export const connectionChannel = (connId: ConnectionId): WebSocketChannel => {
  const channel: any = Object.create(WebSocketChannel);
  channel.platform = WEBSOCKET;
  channel.type = '@connection';
  channel.id = connId;
  channel.uid = `websocket:@connection:*:${connId}`;
  return channel;
};
