/* eslint-disable class-methods-use-this */
import { makeClassProvider } from '@sociably/core/service';
import { BrokerI } from '../interface';
import type { ConnIdentifier } from '../types';

/**
 * @category Provider
 */
export class LocalOnlyBroker implements BrokerI {
  start(): Promise<void> {
    return Promise.resolve();
  }

  stop(): Promise<void> {
    return Promise.resolve();
  }

  dispatchRemote(): Promise<ConnIdentifier[]> {
    return Promise.resolve([]);
  }

  subscribeTopicRemote(): Promise<boolean> {
    return Promise.resolve(false);
  }

  unsubscribeTopicRemote(): Promise<boolean> {
    return Promise.resolve(false);
  }

  disconnectRemote(): Promise<boolean> {
    return Promise.resolve(false);
  }

  onRemoteEvent(): void {}
}

const LocalOnlyBrokerP = makeClassProvider({
  lifetime: 'singleton',
})(LocalOnlyBroker);

type LocalOnlyBrokerP = LocalOnlyBroker;

export default LocalOnlyBrokerP;
