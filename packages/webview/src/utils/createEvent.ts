import type { SociablyUser } from '@sociably/core';
import type { EventInput, EventValue } from '@sociably/websocket';
import { WEBVIEW } from '../constant.js';
import WebviewConnection from '../Connection.js';
import type { WebviewEvent } from '../types.js';

const WebviewEventProto = { platform: WEBVIEW };

const createEvent = <
  User extends null | SociablyUser,
  Value extends EventValue,
>(
  value: EventInput,
  connection: WebviewConnection,
  user: User
): WebviewEvent<Value, User> => {
  const event: WebviewEvent<Value, User> = Object.create(WebviewEventProto);

  const { category, type, payload } = value;
  event.category = category || 'default';
  event.type = type;
  event.payload = payload;
  event.channel = null;
  event.thread = connection;
  event.user = user;

  return event;
};

export default createEvent;
