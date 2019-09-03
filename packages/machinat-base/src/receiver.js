// @flow
import invariant from 'invariant';
import type {
  MachinatChannel,
  MachinatUser,
  MachinatEvent,
  MachinatMetadata,
} from 'machinat/types';
import type { EventIssuer } from './types';

// BaseReceiver provide event/error issuer binding logic for implementation
// classes to inherit.
class BaseReceiver<
  Channel: MachinatChannel,
  User: ?MachinatUser,
  Event: MachinatEvent<any>,
  Metadata: MachinatMetadata<any>,
  Response
> {
  _isBound: boolean;
  _issueEvent: void | EventIssuer<Channel, User, Event, Metadata, Response>;
  _issueError: void | (Error => void);

  constructor() {
    this._isBound = false;
  }

  get isBound() {
    return this._isBound;
  }

  issueEvent(
    channel: Channel,
    user: User,
    event: Event,
    metadata: Metadata
  ): Promise<Response> {
    invariant(this._issueEvent, 'receiver is not bound');
    return this._issueEvent(channel, user, event, metadata);
  }

  issueError(err: Error) {
    invariant(this._issueError, 'receiver is not bound');
    return this._issueError(err);
  }

  bindIssuer(
    eventIssuer: EventIssuer<Channel, User, Event, Metadata, Response>,
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
    this._issueEvent = undefined;
    this._issueError = undefined;
    return true;
  }
}

export default BaseReceiver;
