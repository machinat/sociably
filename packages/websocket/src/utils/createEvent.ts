import { SociablyUser } from '@sociably/core';
import WebSocketConnection from '../Connection';
import { WEBSOCKET } from '../constant';
import { EventInput, WebSocketEvent } from '../types';

const WebSocketEventProto = { platform: WEBSOCKET };

const createEvent = <User extends null | SociablyUser>(
  value: EventInput,
  thread: WebSocketConnection,
  user: User
): WebSocketEvent<any, User> => {
  const event: WebSocketEvent<any, User> = Object.create(WebSocketEventProto);

  const { category, type, payload } = value;
  event.category = category || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = null;
  event.thread = thread;
  event.user = user;

  return event;
};

export default createEvent;
