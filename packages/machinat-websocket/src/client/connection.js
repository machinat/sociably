// @flow
import type WebSocketChannel from '../channel';
import type { ConnectionInfo } from '../types';

export type ClientEvent = {|
  type: string,
  subtype: void | string,
  payload: any,
|};

type QueuedEventJob = {
  event: ClientEvent,
  resolve: () => void,
  reject: any => void,
};

type EventListener = (
  event: ClientEvent,
  channel: WebSocketChannel,
  info: ConnectionInfo
) => void;

export default class Connection {
  _connected: boolean;
  _channel: void | WebSocketChannel;
  _info: void | ConnectionInfo;

  _sendEvent: ClientEvent => Promise<void>;
  _disconnect: string => Promise<void>;

  _eventListners: EventListener[];
  _queuedEventJobs: QueuedEventJob[];

  constructor(
    sendEvent: ClientEvent => Promise<void>,
    disconnect: string => Promise<void>
  ) {
    this._connected = false;
    this._sendEvent = sendEvent;
    this._disconnect = disconnect;
    this._eventListners = [];
    this._queuedEventJobs = [];
  }

  get channel() {
    return this._channel;
  }

  get info() {
    return this._info;
  }

  get connected() {
    return this._connected;
  }

  send(event: ClientEvent): Promise<void> {
    if (this._channel) {
      return this._sendEvent(event);
    }

    return new Promise((resolve, reject) => {
      this._queuedEventJobs.push({ event, resolve, reject });
    });
  }

  removeEventListner(listener: EventListener) {
    const listenerIdx = this._eventListners.findIndex(fn => fn === listener);

    if (listenerIdx === -1) {
      return false;
    }

    this._eventListners.splice(listenerIdx, 1);
    return true;
  }

  disconnect(reason: string) {
    this._disconnect(reason);
  }

  onEvent(listener: EventListener) {
    this._eventListners.push(listener);
  }

  _setConnected(channel: WebSocketChannel, info: ConnectionInfo) {
    this._connected = true;
    this._channel = channel;
    this._info = info;
    this._flushQueuedEvent();
  }

  _setDisconnected() {
    this._connected = false;
  }

  _flushQueuedEvent() {
    for (const { event, resolve, reject } of this._queuedEventJobs) {
      this._sendEvent(event)
        .then(resolve)
        .catch(reject);
    }

    this._queuedEventJobs = [];
  }

  _failAllEventsJob(err: Error) {
    for (const { reject } of this._queuedEventJobs) {
      reject(err);
    }

    this._queuedEventJobs = [];
  }

  _emitEvent(event: ClientEvent) {
    this._eventListners.forEach(listener => {
      listener(event, (this._channel: any), (this._info: any)); // assume it's connected already
    });
  }
}
