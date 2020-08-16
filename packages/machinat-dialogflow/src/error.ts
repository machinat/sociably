import type { protos } from '@google-cloud/dialogflow';

type Status = protos.google.rpc.IStatus;

class DialogFlowAPIError extends Error {
  name = 'DialogFlowAPIError';

  responseId: undefined | string;
  status: null | Status;

  constructor(responseId?: null | string, status?: null | Status) {
    super(status?.message || 'unknown error');

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DialogFlowAPIError);
    }

    this.responseId = responseId || undefined;
    this.status = status || null;
  }
}

export default DialogFlowAPIError;
