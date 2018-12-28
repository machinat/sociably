// @flow
import type { MachinatNode } from 'types/element';
import type { RootAction } from 'machinat-renderer/types';

export interface MachinatThread {
  platform: string;
  type: string;
  uid(): string;
}

export interface MachinatEvent {
  platfrom: string;
  type: string;
  subtype: string;
  thread: ?MachinatThread;
  shouldRespond: boolean;
}

export type SendResponse<Action, Native, Job, Result> = {
  jobs: ?(Job[]),
  results: ?(Result[]),
  actions: ?(RootAction<Action, Native>[]),
  message: MachinatNode,
};

export interface MachinatClient<Action, Native, Job, Result> {
  send(
    thread: string | Object,
    message: MachinatNode,
    options: Object
  ): Promise<SendResponse<Action, Native, Job, Result>>;
}

export interface MachinatContext<Client: MachinatClient<any, any, any, any>> {
  source: string;
  event: MachinatEvent;
  client: Client;
}
