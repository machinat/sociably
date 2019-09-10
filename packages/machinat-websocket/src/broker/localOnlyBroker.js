// @flow
import type { SocketBroker } from '../types';

/* eslint-disable class-methods-use-this */
export default class LocalOnlyBroker implements SocketBroker {
  broadcastRemote() {
    return Promise.resolve(null);
  }

  attachRemoteConnectionToTopic() {
    return Promise.resolve(false);
  }

  detachRemoteConnectionFromTopic() {
    return Promise.resolve(false);
  }

  onRemoteEvent() {}
}
