import { STATUS_CODES } from 'http';
import {
  LineResult,
  FailMessagingApiResult,
  FailOAuthApiResult,
} from './types';

class LineApiError extends Error {
  info: FailMessagingApiResult | FailOAuthApiResult;
  code: number;
  status: string;

  constructor({ code, body }: LineResult) {
    if (body.error) {
      const oauthResult = body as FailOAuthApiResult;

      super(`${oauthResult.error}: ${oauthResult.error_description}`);
      this.info = oauthResult;
    } else if (body.message) {
      const messagingResult = body as FailMessagingApiResult;

      super(
        `${messagingResult.message}: ${messagingResult.details
          .map((d, i) => `${i + 1}) ${d.message}, at ${d.property}.`)
          .join(' ')}`
      );
      this.info = messagingResult;
    } else {
      super(JSON.stringify(body));
      this.info = body as any;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LineApiError);
    }

    this.code = code;
    this.status = STATUS_CODES[code] as string;
    this.name = `LineApiError (${this.status})`;
  }
}

export default LineApiError;
