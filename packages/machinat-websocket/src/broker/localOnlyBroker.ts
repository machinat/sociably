/* eslint-disable class-methods-use-this */
import { provider } from '@machinat/core/service';
import { BrokerI } from '../interface';

/**
 * @category Provider
 */
class LocalOnlyBroker implements BrokerI {
  start() {
    return Promise.resolve();
  }

  stop() {
    return Promise.resolve();
  }

  dispatchRemote() {
    return Promise.resolve(null);
  }

  subscribeTopicRemote() {
    return Promise.resolve(false);
  }

  unsubscribeTopicRemote() {
    return Promise.resolve(false);
  }

  disconnectRemote() {
    return Promise.resolve(false);
  }

  onRemoteEvent() {}
}

export default provider<LocalOnlyBroker>({
  lifetime: 'singleton',
})(LocalOnlyBroker);
