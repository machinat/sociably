// @flow
import type { MachinatChannel } from 'machinat-base/types';

class WebSocketChannel implements MachinatChannel {
  type: string;
  subtype: void | string;
  uid: string;
  id: string;

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

  constructor(type: string, subtype: void | string, id: string) {
    this.id = id;
    this.type = type;
    this.subtype = subtype;
    this.uid = `websocket:${type}:${subtype || '*'}:${id}`;
  }
}

export default WebSocketChannel;
