/** @internal */ /** */
import { WEBSOCKET } from './constant';
import type { WebSocketEvent } from './types';

const WebEventProto = {
  platform: WEBSOCKET,
};

const createEvent = (
  kind: undefined | string,
  type: string,
  payload: any
): WebSocketEvent => {
  const event: WebSocketEvent = Object.create(WebEventProto);

  event.kind = kind || 'default';
  event.type = type;
  event.payload = payload;

  return event;
};

export default createEvent;
