export default class SocketError extends Error {
  code: number;
  reason: string;
  name = 'SocketError';

  // TODO: error code
  constructor(
    /* code: number, */
    reason: string
  ) {
    super(reason);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SocketError);
    }

    // this.code = code;
    this.reason = reason;
  }
}
