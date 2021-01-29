class AuthError extends Error {
  code: number;
  platform: undefined | string;

  constructor(platform: undefined | string, code: number, message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }

    this.code = code;
    this.platform = platform;
  }
}

export default AuthError;
