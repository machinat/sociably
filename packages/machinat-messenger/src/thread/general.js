// @flow
import invariant from 'invariant';
import type { MachinatThread, ActionWithoutPause } from 'machinat-base/types';

import type {
  MessengerActionValue,
  MessengerJob,
  MessengerComponent,
} from '../types';

import { appendFields } from './utils';

const POST = 'POST';

class GeneralMessengerAPIThread
  implements MachinatThread<MessengerJob, { [string]: any }> {
  subtype: string;
  uid: string;
  path: string;
  prefix: string;

  platform = 'messenger';
  type = 'page_api';
  allowPause = false;

  constructor(path: string, commonBody?: { [string]: any }) {
    const apiName = path.slice(3); // get "xxx" from realtive url "me/xxx"
    this.subtype = apiName;
    this.uid = `messenger:default:${apiName}`;
    this.path = path;
    this.prefix = commonBody ? appendFields('', commonBody) : '';
  }

  createJobs(
    actions:
      | null
      | ActionWithoutPause<MessengerActionValue, MessengerComponent>[],
    body: { [string]: any }
  ) {
    invariant(
      actions === null,
      'there should be nothing rendered at GeneralMessengerAPIThread'
    );

    return [
      {
        request: {
          body: appendFields(this.prefix, body),
          relative_url: this.path,
          method: POST,
        },
        threadId: this.uid,
      },
    ];
  }
}

export default GeneralMessengerAPIThread;
