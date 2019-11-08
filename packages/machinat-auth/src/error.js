// @flow
import type { MahcinatAuthError } from './types';

class AuthError extends Error implements MahcinatAuthError {
  code: number;

  constructor(code: number, message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }

    this.code = code;
  }
}

export default AuthError;
