// @flow
import Symbol$observable from 'symbol-observable';

import type { MachinatNativeComponent } from 'machinat/types';
import type {
  MachinatChannel,
  MachinatEvent,
  EventFrame,
  MachinatMetadata,
} from './types';

// MachinatEmitter provide events and errors listening methods for machinat bot
// implementation classes to inherit.
export default class MachinatEmitter<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  SegmentValue,
  Native: MachinatNativeComponent<SegmentValue>,
  Job,
  Result,
  SendOptions
> {
  _eventListeners: ((
    EventFrame<
      Channel,
      Event,
      Metadata,
      SegmentValue,
      Native,
      Job,
      Result,
      SendOptions
    >
  ) => void)[];

  _errorListeners: ((Error) => void)[];

  constructor() {
    this._eventListeners = [];
    this._errorListeners = [];
  }

  onEvent(
    listener: (
      EventFrame<
        Channel,
        Event,
        Metadata,
        SegmentValue,
        Native,
        Job,
        Result,
        SendOptions
      >
    ) => void
  ) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    this._eventListeners.push(listener);
    return (this: any);
  }

  removeEventListener(
    listener: (
      EventFrame<
        Channel,
        Event,
        Metadata,
        SegmentValue,
        Native,
        Job,
        Result,
        SendOptions
      >
    ) => void
  ) {
    const idx = this._eventListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  emitEvent(
    frame: EventFrame<
      Channel,
      Event,
      Metadata,
      SegmentValue,
      Native,
      Job,
      Result,
      SendOptions
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
    return (this: any);
  }

  removeErrorListener(listener: Error => void) {
    const idx = this._errorListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._errorListeners.splice(idx, 1);
    return true;
  }

  emitError(err: Error) {
    if (this._errorListeners.length === 0) {
      throw err;
    }

    for (const listener of this._errorListeners) {
      listener(err);
    }
  }

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
