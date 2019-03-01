// @flow
/* eslint-disable import/prefer-default-export */
import type { LineRawEvent, LineEvent } from '../types';

export const eventFactory = (proto: Object, type: string, subtype?: string) => (
  raw: LineRawEvent,
  useReplyAPI: boolean
  // TODO: type the line events
): LineEvent => {
  const event = Object.create(proto);

  event.raw = raw;
  event.type = type;
  event.subtype = subtype;
  event._useReplyAPI = useReplyAPI;

  return (event: any);
};
