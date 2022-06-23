export const CHANNEL_REQUEST_GETTER = Symbol(
  'channel_request_getter.line.sociably'
);
export const BULK_REQUEST_GETTER = Symbol('bulk_request_getter.line.sociably');

export const LINE = 'line' as const;

export const PATH_REPLY = 'v2/bot/message/reply';

export const PATH_PUSH = 'v2/bot/message/push';

export const PATH_MULTICAST = 'v2/bot/message/multicast';

export const PATH_RICHMENU = 'v2/bot/richmenu';

export enum LiffContextOs {
  Ios,
  Android,
  Web,
}
