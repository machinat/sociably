// @flow
import type { MachinatNode } from 'types/element';

export interface MachinatThread {
  +platform: string;
  +type: string;
  +identifier: string;
}

export interface MachinatEvent {
  platfrom: string;
  type: string;
  subtype: string;
  thread: ?MachinatThread;
  shouldRespond: boolean;
}

export type SendingResponse<Job, Result> = {
  jobs: ?(Job[]),
  result: ?(Result[]),
};

export interface MachinatClient<Job, Result> {
  send(
    thread: string | Object,
    message: MachinatNode,
    options: Object
  ): Promise<SendingResponse<Job, Result>>;
}

export interface MachinatContext<Client: MachinatClient<any, any>> {
  source: string;
  event: MachinatEvent;
  client: Client;
}
