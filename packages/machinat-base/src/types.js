// @flow
import type { MachinatNode } from 'types/element';
import type { MachinatAction } from 'machinat-renderer/types';

export interface MachinatThread {
  platform: string;
  type: string;
  uid(): string;
}

export interface MachinatEvent {
  platform: string;
  type: string;
  subtype: string;
  thread: ?MachinatThread;
  shouldRespond: boolean;
}

export type SendResponse<Rendered, Native, Job, Result> = {
  jobs: ?(Job[]),
  results: ?(Result[]),
  actions: ?(MachinatAction<Rendered, Native>[]),
  message: MachinatNode,
};

export interface MachinatClient<Rendered, Native, Job, Result> {
  send(
    thread: string | Object,
    message: MachinatNode,
    options: Object
  ): Promise<SendResponse<Rendered, Native, Job, Result>>;
}

export interface MachinatContext<Client: MachinatClient<any, any, any, any>> {
  source: string;
  event: MachinatEvent;
  client: Client;
}
