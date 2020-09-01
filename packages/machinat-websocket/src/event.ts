import { WEBSOCKET } from './constant';
import type { WebSocketEvent } from './types';

const WebEventProto = {
  platform: WEBSOCKET,
};

const createEvent = (
  type: string,
  subtype: void | string,
  payload: any
): WebSocketEvent => {
  const event = Object.create(WebEventProto);

  event.type = type;
  event.subtype = subtype;
  event.payload = payload;

  return event;
};

export default createEvent;