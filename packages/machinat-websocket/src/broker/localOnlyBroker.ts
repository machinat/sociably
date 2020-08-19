import { provider } from '@machinat/core/service';
import { ClusterBroker } from '../interface';

/* eslint-disable class-methods-use-this */
class LocalOnlyBroker implements ClusterBroker {
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
