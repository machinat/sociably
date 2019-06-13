// @flow
import type { SocketBroker } from '../types';

/* eslint-disable class-methods-use-this */
export default class LocalOnlyBroker implements SocketBroker {
  broadcastRemote() {
    return Promise.resolve(null);
  }

  connectRemoteSocket() {
    return Promise.resolve(false);
  }

  disconnectRemoteSocket() {
    return Promise.resolve(false);
  }

  updateConnected() {
    return Promise.resolve(true);
  }

  updateDisconnected() {
    return Promise.resolve(true);
  }

  getRemoteConnections() {
    return Promise.resolve(null);
  }
}
