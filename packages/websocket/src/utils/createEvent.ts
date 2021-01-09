import { MachinatUser } from '@machinat/core/types';
import { WebSocketConnection } from '../channel';
import { WEBSOCKET } from '../constant';
import { EventInput, WebSocketEvent } from '../types';

const WebEventProto = { platform: WEBSOCKET };

const createEvent = <User extends null | MachinatUser>(
  value: EventInput,
  channel: WebSocketConnection,
  user: User
): WebSocketEvent<any, User> => {
  const event: WebSocketEvent<any, User> = Object.create(WebEventProto);

  const { kind, type, payload } = value;
  event.kind = kind || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

export default createEvent;
