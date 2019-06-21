// @flow
import Symbol$observable from 'symbol-observable';
import Queue from 'machinat-queue';

import type { MachinatNode } from 'machinat/types';
import type MachinatRenderer from 'machinat-renderer';
import type { MachinatNativeComponent } from 'machinat-renderer/types';
import type {
  BotPlugin,
  MachinatChannel,
  MachinatEvent,
  EventFrame,
  MachinatMetadata,
  MachinatWorker,
} from './types';
import type MachinatReceiver from './receiver';

import Engine from './engine';

// BaseBot provide basic constucting and event/error listening entry point for
// all the machinat bot to inherit.
export default class BaseBot<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result
> {
  platform: string;
  engine: Engine<
    Channel,
    Event,
    Metadata,
    Response,
    SegmentValue,
    Native,
    Job,
    Result
  >;
  plugins:
    | void
    | BotPlugin<
        Channel,
        Event,
        Metadata,
        Response,
        SegmentValue,
        Native,
        Job,
        Result
      >[];
  _eventListeners: ((
    EventFrame<Channel, Event, Metadata, SegmentValue, Native, Job, Result>
  ) => void)[];
  _errorListeners: ((Error) => void)[];

  constructor(
    platform: string,
    receiver: MachinatReceiver<Channel, Event, Metadata, Response>,
    renderer: MachinatRenderer<SegmentValue, Native>,
    worker: MachinatWorker<Job, Result>,
    plugins?: BotPlugin<
      Channel,
      Event,
      Metadata,
      Response,
      SegmentValue,
      Native,
      Job,
      Result
    >[]
  ) {
    this.platform = platform;
    this.plugins = plugins;
    this._eventListeners = [];
    this._errorListeners = [];

    const eventMiddlewares = [];
    const dispatchMiddlewares = [];

    if (plugins) {
      for (const plugin of plugins) {
        const { dispatchMiddleware, eventMiddleware } = plugin(this);

        if (eventMiddleware) eventMiddlewares.push(eventMiddleware);
        if (dispatchMiddleware) dispatchMiddlewares.push(dispatchMiddleware);
      }
    }

    const queue = new Queue();
    worker.start(queue);

    this.engine = new Engine(
      platform,
      this,
      renderer,
      queue,
      eventMiddlewares,
      dispatchMiddlewares
    );

    receiver.bindIssuer(
      this.engine.eventIssuer(frame => {
        this._emitEvent(frame);
        return Promise.resolve();
      }),
      this._emitError
    );
  }

  send( // eslint-disable-line class-methods-use-this
    channel: Channel,
    message: MachinatNode,
    options: any // eslint-disable-line no-unused-vars
  ): Promise<null | Result[]> {
    throw new TypeError('Bot#send() should not be called on BaseBot');
  }

  onEvent(
    listener: (
      EventFrame<Channel, Event, Metadata, SegmentValue, Native, Job, Result>
    ) => void
  ) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._eventListeners.push(listener);
  }

  removeEventListener(
    listener: (
      EventFrame<Channel, Event, Metadata, SegmentValue, Native, Job, Result>
    ) => void
  ) {
    const idx = this._eventListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  _emitEvent(
    frame: EventFrame<
      Channel,
      Event,
      Metadata,
      SegmentValue,
      Native,
      Job,
      Result
    >
  ) {
    for (const listener of this._eventListeners) {
      listener(frame);
    }
  }

  onError(listener: Error => void) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._errorListeners.push(listener);
  }

  removeErrorListener(listener: Error => void) {
    const idx = this._errorListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._errorListeners.splice(idx, 1);
    return true;
  }

  _emitError = (err: Error) => {
    if (this._errorListeners.length === 0) {
      throw err;
    }

    for (const listener of this._errorListeners) {
      listener(err);
    }
  };

  // $FlowFixMe
  [Symbol$observable]() {
    return {
      subscribe: observer => {
        const eventListener = (frame: EventFrame) => {
          observer.next(frame);
        };

        const errorListener = err => {
          observer.error(err);
        };

        this.onEvent(eventListener);
        this.onError(errorListener);

        return {
          unsubscribe: () => {
            this.removeEventListener(eventListener);
            this.removeErrorListener(errorListener);
          },
        };
      },
    };
  }
}
