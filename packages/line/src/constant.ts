export const CHANNEL_REQUEST_GETTER = Symbol(
  'channel_request_getter.line.machinat'
);
export const BULK_REQUEST_GETTER = Symbol('bulk_request_getter.line.machinat');

/** @internal */
export const LINE = 'line' as const;

/** @internal */
export const PATH_REPLY = 'v2/bot/message/reply';

/** @internal */
export const PATH_PUSH = 'v2/bot/message/push';

/** @internal */
export const PATH_MULTICAST = 'v2/bot/message/multicast';

/** @internal */
export const PATH_RICHMENU = 'v2/bot/richmenu';

export enum LiffContextOs {
  Ios,
  Android,
  Web,
}
