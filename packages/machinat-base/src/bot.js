// @flow
import type { MachinatClient, MachinatContext } from './types';
import type BaseConnector from './baseConnector';

export default class MachinatBot<Client: MachinatClient<any, any, any, any>> {
  client: Client;
  connector: BaseConnector<MachinatContext<Client>>;

  constructor(
    client: Client,
    connector: BaseConnector<MachinatContext<Client>>
  ) {
    this.client = client;
    this.connector = connector;
  }
}
