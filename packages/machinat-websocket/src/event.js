// @flow
import type WebThread from './thread';
import type { WebEvent } from './types';

const WebEventProto = {
  platform: 'web',
  shouldRespond: false,
};

const createEvent = (
  type: string,
  subtype: void | string,
  thread: WebThread,
  channelId: string,
  payload: any
): WebEvent => {
  const event = Object.create(WebEventProto);

  event.type = type;
  event.subtype = subtype;
  event.payload = payload;
  event.thread = thread;
  event.channelId = channelId;

  return event;
};

export default createEvent;
