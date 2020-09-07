/** @internal */ /** */
import { WEBSOCKET } from './constant';
import type { WebSocketEvent } from './types';

const WebEventProto = {
  platform: WEBSOCKET,
};

const createEvent = (
  category: undefined | string,
  type: string,
  payload: any
): WebSocketEvent => {
  const event: WebSocketEvent = Object.create(WebEventProto);

  event.category = category || 'default';
  event.type = type;
  event.payload = payload;

  return event;
};

export default createEvent;
