// @flow
import type WebSocketChannel from '../channel';

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

type EventListener = (event: ClientEvent, channel: WebSocketChannel) => void;

export default class Connection {
  _channel: void | WebSocketChannel;
  _sendEvent: ClientEvent => Promise<void>;
  _disconnect: string => Promise<void>;

  _eventListners: EventListener[];
  _queuedEventJobs: QueuedEventJob[];

  constructor(
    sendEvent: ClientEvent => Promise<void>,
    disconnect: string => Promise<void>
  ) {
    this._sendEvent = sendEvent;
    this._disconnect = disconnect;
    this._eventListners = [];
    this._queuedEventJobs = [];
  }

  get channel() {
    return this._channel;
  }

  get connected() {
    return this._channel !== undefined;
  }

  _setConnected(channel: WebSocketChannel) {
    this._channel = channel;
    this._flushQueuedEvent();
  }

  _setDisconnected() {
    this._channel = undefined;
  }

  send(event: ClientEvent): Promise<void> {
    if (this._channel) {
      return this._sendEvent(event);
    }

    return new Promise((resolve, reject) => {
      this._queuedEventJobs.push({ event, resolve, reject });
    });
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

  disconnect(reason: string) {
    this._disconnect(reason);
  }

  onEvent(listener: EventListener) {
    this._eventListners.push(listener);
  }

  _emitEvent(event: ClientEvent, channel: WebSocketChannel) {
    this._eventListners.forEach(listener => {
      listener(event, channel);
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
}
