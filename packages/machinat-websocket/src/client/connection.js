// @flow
import type WebSocketThread from '../thread';

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

type EventListener = (event: ClientEvent, thread: WebSocketThread) => void;

export default class Connection {
  _thread: void | WebSocketThread;
  _sendEvent: ClientEvent => Promise<void>;
  _disconnect: () => Promise<void>;

  _eventListners: EventListener[];
  _queuedEventJobs: QueuedEventJob[];

  constructor(
    sendEvent: ClientEvent => Promise<void>,
    disconnect: () => Promise<void>
  ) {
    this._sendEvent = sendEvent;
    this._disconnect = disconnect;
    this._eventListners = [];
    this._queuedEventJobs = [];
  }

  get thread() {
    return this._thread;
  }

  get connected() {
    return this._thread !== undefined;
  }

  _setConnected(thread: WebSocketThread) {
    this._thread = thread;
    this._flushQueuedEvent();
  }

  _setDisconnected() {
    this._thread = undefined;
  }

  send(event: ClientEvent): Promise<void> {
    if (this._thread) {
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

  disconnect() {
    this._disconnect();
  }

  onEvent(listener: EventListener) {
    this._eventListners.push(listener);
  }

  _emitEvent(event: ClientEvent, thread: WebSocketThread) {
    this._eventListners.forEach(listener => {
      listener(event, thread);
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
