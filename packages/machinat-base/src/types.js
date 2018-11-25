// @flow
export interface MachinatThread {
  type: string;
  id: string;
}

export interface MachinatEvent {
  platfrom: string;
  type: string;
  subtype: string;
  thread: ?MachinatThread;
  shouldRespond: boolean;
}

export interface MachinatClient<Msg, Result> {
  send(thread: MachinatThread, message: Msg, options: Object): Promise<Result>;
}

export interface MachinatContext<Client: MachinatClient<any, any>> {
  source: string;
  event: MachinatEvent;
  client: Client;
}
