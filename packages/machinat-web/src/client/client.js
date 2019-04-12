// @flow
import EventEmitter from 'events';
import createChannel from './createChannel';
import WebThread from '../thread';
import { ConnectionError } from '../error';
import type Channel, {
  ConnectBody,
  DisconnectBody,
  EventBody,
} from '../channel';

const empty = () => {};

type ClientOptions = {
  url?: string,
  // TODO:
  // reconnecting: boolean,
  // heartbeatInterval: number,
  // heartbeatTimeout: number,
  // channelTimeout: number,
};

type ClientOptionsInput = $Shape<ClientOptions>;

type DispatchOptions = {
  shouldAnswer?: boolean,
  actionType?: string,
};

type DelayedEvent = {
  body: EventBody,
  resolve: () => void,
  reject: any => void,
};

class WebClient extends EventEmitter {
  options: ClientOptions;
  channel: Channel;

  _registerSeq: number;
  // _queuedEvents: DelayedEvent[];

  constructor(optionsInput: ClientOptionsInput) {
    super();

    const defaultOptions = {
      url: './',
    };
    const options = Object.assign(defaultOptions, optionsInput);

    this.options = options;
    this.channel = createChannel(options.url);

    this.channel.on('open', () => {
      this._register().catch(this._emitError);
    });

    this.channel.on('close', () => {
      if (this.thread) {
        this.thread = null;
        this._rejectAllJobs(new ConnectionError());
      }
    });

    this.channel.on('connect', ({ uid, req }: ConnectBody) => {
      if (req === this._registerSeq) {
        const thread = WebThread.fromUid(uid);
        this.thread = thread;

        this._flushDelayedEvents();
      }
    });

    this.channel.on('disconnect', ({ uid }: DisconnectBody) => {
      if (this.thread && uid === this.thread.uid) {
        this.thread = null;
        this._rejectAllJobs(new ConnectionError());
      }
    });

    this.channel.on('connect_fail', () => {
      // throw
    });

    this.channel.on('event', (body: EventBody) => {
      const { uid, category, payload } = body;
      if (this.thread && uid === this.thread.uid) {
        this._emitAction(category, payload);
      }
    });

    // TODO: implement answering
    // this.channel.on('answer');
    // this.channel.on('reject');
  }

  get connected() {
    if (!this.thread) {
      return false;
    }

    return this.channel.isConnectedTo(this.thread.uid);
  }

  async disconnect() {
    if (!this.thread) {
      throw '?????????????????????';
    }

    const { uid } = this.thread;

    if (this.connected) {
      await this.channel.disconnect({ uid });
    }

    this.thread = null;
  }

  async reconnect() {
    const seq = await this._register();

    await new Promise((resolve, reject) => {
      const successListener = (body: ConnectBody) => {
        if (seq === body.req) {
          this.channel.removeListener('connect', successListener);
          // eslint-disable-next-line no-use-before-define
          this.channel.removeListener('connect_fail', failListener);
          resolve();
        }
      };

      const failListener = (body: DisconnectBody) => {
        if (seq === body.req) {
          this.channel.removeListener('connect', successListener);
          this.channel.removeListener('connect_fail', failListener);
          reject('?????????????');
        }
      };

      this.channel.addListener('connect', successListener);
      this.channel.addListener('connect_fail', failListener);
    });
  }

  send(payload: any, options?: DispatchOptions): Promise<void> {
    const actionType = options && options.actionType;
    const shouldAnswer = !!(options && options.shouldAnswer);

    if (!this.connected) {
      return new Promise((resolve, reject) => {
        this._queuedEvents.push({ type: actionType, payload, resolve, reject });
      });
    }

    return this.channel
      .event({
        uid: this.thread.uid,
        type: actionType,
        payload,
      })
      .then(empty);
  }

  _flushDelayedEvents() {
    this._queuedEvents.forEach(this._sendDelayedEvent);

    this._queuedEvents = [];
  }

  _sendDelayedEvent = async ({ body, resolve, reject }: DelayedEvent) => {
    try {
      await this.channel.event(body);

      resolve();
    } catch (e) {
      reject(e);
    }
  };

  _rejectAllJobs(err: Error) {
    this._queuedEvents.forEach(({ reject }) => {
      reject(err);
    });

    this._queuedEvents = [];
  }

  async register(): ThreadClient {
    const registerSeq = await this.channel.register(
      this.options.register || { type: 'default' }
    );

    this._registerSeq = registerSeq;
    return registerSeq;
  }
}

export default WebClient;
