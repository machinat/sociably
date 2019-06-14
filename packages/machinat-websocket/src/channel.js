// @flow
import type { MachinatChannel } from 'machinat-base/types';

class WebSocketChannel implements MachinatChannel {
  type: string;
  subtype: void | string;
  id: void | string;
  uid: string;

  platform = 'websocket';

  static fromUid(uid: string): null | WebSocketChannel {
    const [platform, type, subtype, id] = uid.split(':');
    if (platform !== 'websocket' || !type || !id) {
      return null;
    }

    return new WebSocketChannel(
      type,
      subtype && subtype !== '*' ? subtype : undefined,
      id
    );
  }

  constructor(type?: string, subtype?: string, id?: string) {
    this.id = id;
    this.type = type || 'default';
    this.subtype = subtype;
    this.uid = `websocket:${this.type}:${subtype || '*'}:${id || '*'}`;
  }
}

export default WebSocketChannel;
