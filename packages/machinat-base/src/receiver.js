// @flow
import type {
  EventIssuer,
  MachinatChannel,
  MachinatEvent,
  MachinatMetadata,
} from './types';

// BaseReceiver provide event/error issuer binding logic for implementation
// classes to inherit.
class BaseReceiver<
  Channel: MachinatChannel,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response
> {
  _isBound: boolean;
  _issueEvent: EventIssuer<Channel, Event, Metadata, Response>;
  _issueError: Error => void;

  constructor() {
    this._isBound = false;
  }

  get isBound() {
    return this._isBound;
  }

  bindIssuer(
    eventIssuer: EventIssuer<Channel, Event, Metadata, Response>,
    errorIssuer: (err: Error) => void
  ): boolean {
    if (this._isBound) {
      return false;
    }

    this._isBound = true;
    this._issueEvent = eventIssuer;
    this._issueError = errorIssuer;
    return true;
  }

  unbindIssuer(): boolean {
    if (!this._isBound) {
      return false;
    }

    this._isBound = false;
    return true;
  }
}

export default BaseReceiver;
