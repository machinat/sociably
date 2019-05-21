// @flow
import type WebThread from './thread';
import type { WebSocketEvent } from './types';

const WebEventProto = {
  platform: 'web',
  shouldRespond: false,
};

const createEvent = (
  type: string,
  subtype: void | string,
  thread: WebThread,
  socketId: string,
  payload: any
): WebSocketEvent => {
  const event = Object.create(WebEventProto);

  event.type = type;
  event.subtype = subtype;
  event.payload = payload;
  event.thread = thread;
  event.socketId = socketId;

  return event;
};

export default createEvent;
