import { SociablyUser } from '@sociably/core';
import WebSocketConnection from '../Connection.js';
import { WEBSOCKET } from '../constant.js';
import { EventInput, WebSocketEvent } from '../types.js';

const WebSocketEventProto = { platform: WEBSOCKET };

const createEvent = <User extends null | SociablyUser>(
  value: EventInput,
  thread: WebSocketConnection,
  user: User,
): WebSocketEvent<any, User> => {
  const event: WebSocketEvent<any, User> = Object.create(WebSocketEventProto);

  const { kind, type, payload } = value;
  event.kind = kind || 'default';
  event.type = type;
  event.payload = payload;
  event.agent = null;
  event.thread = thread;
  event.user = user;

  return event;
};

export default createEvent;
