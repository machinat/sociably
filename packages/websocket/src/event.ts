/** @internal */ /** */
import { MachinatUser } from '@machinat/core/types';
import { WEBSOCKET } from './constant';
import type { WebSocketEvent, EventValue } from './types';
import { WebSocketConnection } from './channel';

const WebEventProto = {
  platform: WEBSOCKET,
};

const createEvent = <
  Value extends EventValue<any, any, any>,
  User extends null | MachinatUser
>(
  kind: undefined | string,
  type: string,
  payload: any,
  channel: WebSocketConnection,
  user: User
): WebSocketEvent<Value, User> => {
  const event: WebSocketEvent<Value, User> = Object.create(WebEventProto);

  event.kind = kind || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = channel;
  event.user = user;

  return event;
};

export default createEvent;
