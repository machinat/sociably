import { SociablyUser } from '@sociably/core';
import { WebSocketConnection } from '../channel';
import { WEBSOCKET } from '../constant';
import { EventInput, WebSocketEvent } from '../types';

const WebEventProto = { platform: WEBSOCKET };

const createEvent = <User extends null | SociablyUser>(
  value: EventInput,
  channel: WebSocketConnection,
  user: User
): WebSocketEvent<any, User> => {
  const event: WebSocketEvent<any, User> = Object.create(WebEventProto);

  const { category, type, payload } = value;
  event.category = category || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

export default createEvent;
