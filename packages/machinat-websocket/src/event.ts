/** @internal */ /** */
import { MachinatUser } from '@machinat/core/types';
import { WEBSOCKET } from './constant';
import type { WebSocketEvent } from './types';
import { ConnectionChannel } from './channel';

const WebEventProto = {
  platform: WEBSOCKET,
};

const createEvent = (
  kind: undefined | string,
  type: string,
  payload: any,
  channel: ConnectionChannel,
  user: null | MachinatUser
): WebSocketEvent => {
  const event: WebSocketEvent = Object.create(WebEventProto);

  event.kind = kind || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

export default createEvent;
