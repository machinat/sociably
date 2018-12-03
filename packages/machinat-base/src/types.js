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

export interface MachinatClient<Result> {
  send(
    thread: string | Object,
    message: MachinatNode,
    options: Object
  ): Promise<?(Result[])>;
}

export interface MachinatContext<Client: MachinatClient<any>> {
  source: string;
  event: MachinatEvent;
  client: Client;
}
