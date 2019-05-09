// @flow
import type { MachinatThread, ActionWithoutPause } from 'machinat-base/types';

class WebThread implements MachinatThread<WebMessageJob, void> {
  type: string;
  subtype: void | string;
  uid: string;
  id: string;

  platform = 'websocket';
  allowPause = true;

  static fromUid(uid: string): null | WebThread {
    const [platform, type, subtype, id] = uid.split(':');
    if (platform !== 'websocket' || !type || !id) {
      return null;
    }

    return new WebThread(
      type,
      subtype && subtype !== '*' ? subtype : undefined,
      id
    );
  }

  constructor(type: string, subtype: ?string, id: string) {
    this.id = id;
    this.subtype = subtype || undefined;
    this.uid = `web:group:${this.subtype || '*'}:${this.id}`;
  }

  createJobs(
    actions: null | ActionWithoutPause<MessageActionValue, MessageComponent>[]
  ) {
    if (actions === null) {
      return null;
    }

    const jobs: WebMessageJob[] = new Array(actions.length);

    for (let i = 0; i < actions.length; i += 1) {
      const { value } = actions[i];
      jobs[i] = {
        threadId: this.uid,
        message:
          typeof value === 'string'
            ? { type: 'message', subtype: 'text', payload: value }
            : value,
      };
    }

    return jobs;
  }
}

export default WebThread;
