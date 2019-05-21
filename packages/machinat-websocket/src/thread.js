// @flow
import type { MachinatThread } from 'machinat-base/types';

class WebSocketThread implements MachinatThread {
  type: string;
  subtype: void | string;
  uid: string;
  id: string;

  platform = 'websocket';

  static fromUid(uid: string): null | WebSocketThread {
    const [platform, type, subtype, id] = uid.split(':');
    if (platform !== 'websocket' || !type || !id) {
      return null;
    }

    return new WebSocketThread(
      type,
      subtype && subtype !== '*' ? subtype : undefined,
      id
    );
  }

  constructor(type: string, subtype: void | string, id: string) {
    this.id = id;
    this.type = type;
    this.subtype = subtype;
    this.uid = `websocket:${type}:${subtype || '*'}:${id}`;
  }
}

`websocket:@socket:*:${id}`;

if (
  platform === 'websocket' &&
  channel.type === '@socket' &&
  event.type === '@registry'
) {
}

export default WebSocketThread;
