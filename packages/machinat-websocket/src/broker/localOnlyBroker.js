// @flow
import type { SocketBroker } from '../types';

/* eslint-disable class-methods-use-this */
export default class LocalOnlyBroker implements SocketBroker {
  sendRemote() {
    return Promise.resolve(null);
  }

  attachTopicRemote() {
    return Promise.resolve(false);
  }

  detachTopicRemote() {
    return Promise.resolve(false);
  }

  disconnectRemote() {
    return Promise.resolve(false);
  }

  onRemoteEvent() {}
}
