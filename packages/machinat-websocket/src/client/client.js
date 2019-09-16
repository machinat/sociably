// @flow
import WS from 'ws';
import type { MachinatUser } from 'machinat/types';
import type {
  ConnectBody,
  DisconnectBody,
  EventBody,
  RegisterBody,
  RejectBody,
} from '../socket';
import MachinatSocket from '../socket';
import { WEBSOCKET } from '../constant';
import { connectionScope, userScope, topicScope } from '../channel';
import { ConnectionError } from '../error';
import Connection from '../connection';
import type { WebSocketChannel, UserScope, ConnectionScope } from '../types';

export type ClientEvent = {|
  type: string,
  subtype: void | string,
  payload: any,
|};

type ClientEventFrame = {|
  user: ?MachinatUser,
  channel: WebSocketChannel,
  event: ClientEvent,
  client: WebScoketClient, // eslint-disable-line no-use-before-define
|};

type ClientOptions = {
  url: string,
  register: RegisterBody,
};

type ClientOptionsInput = $Shape<ClientOptions>;

type PendingEventJob = {
  event: ClientEvent,
  resolve: () => void,
  reject: Error => void,
};

const MACHINAT_WEBSOCKET_PROTOCOL_V0 = 'machinat-websocket-v0';

const createSocket = (url: string) => {
  const webSocket = new WS(url, MACHINAT_WEBSOCKET_PROTOCOL_V0);

  return new MachinatSocket('', webSocket, (null: any));
};

class WebScoketClient {
  options: ClientOptions;
  _socket: MachinatSocket;
  _connected: boolean;
  _registerSeq: number;
  _user: ?MachinatUser;
  _connectionId: string;

  _connectionScope: ConnectionScope;
  _userScope: null | UserScope;

  _queuedEventJobs: PendingEventJob[];

  _eventListeners: ((ClientEventFrame) => void)[];
  _errorListeners: ((Error) => void)[];

  constructor(optionsInput: ClientOptionsInput) {
    this._errorListeners = [];

    const defaultOptions = {
      url: './',
      register: { type: 'default' },
    };
    const options = Object.assign(defaultOptions, optionsInput);

    this.options = options;
    this._connected = false;
    this._queuedEventJobs = [];
    this._eventListeners = [];

    const socket = createSocket(options.url);

    socket.on('open', this._handleSocketOpen);
    socket.on('error', this._handleSocketError);

    socket.on('connect', this._handleConnect);
    socket.on('disconnect', this._handleDisconnect);
    socket.on('event', this._handleEvent);

    socket.on('reject', this._handleReject);
    socket.on('error', this._emitError);
    socket.on('connect_fail', this._handleConnectFail);
    // TODO: implement answering
    // socket.on('answer');

    this._socket = socket;
  }

  get connected() {
    return this._connected;
  }

  async send(event: ClientEvent): Promise<void> {
    if (!this._connected) {
      await new Promise((resolve, reject) => {
        this._queuedEventJobs.push({ resolve, reject, event });
      });
    } else {
      await this._socket.event({ ...event, connectionId: this._connectionId });
    }
  }

  disconnect(reason: string) {
    if (this._connected) {
      this._connected = false;
      this._socket
        .disconnect({ connectionId: this._connectionId, reason })
        .catch(this._emitError);
    }
  }

  onEvent(listener: ClientEventFrame => void) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._eventListeners.push(listener);
  }

  removeEventListener(listener: ClientEventFrame => void) {
    const idx = this._eventListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  _emitEvent(event: ClientEvent, channel: WebSocketChannel) {
    for (const listener of this._eventListeners) {
      listener({
        event,
        user: this._user,
        channel,
        client: this,
      });
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

  _handleSocketOpen = async () => {
    const seq = await this._socket.register(this.options.register);
    this._registerSeq = seq;
  };

  _handleConnect = ({ connectionId, req, user }: ConnectBody) => {
    if (req !== this._registerSeq) {
      return;
    }

    this._connected = true;
    this._connectionId = connectionId;
    this._connectionScope = connectionScope(
      new Connection('', '', connectionId, user || null, null)
    );

    this._user = user;
    this._userScope = user ? userScope(user) : null;

    this._emitEvent(
      {
        type: '@connect',
        subtype: undefined,
        payload: undefined,
      },
      this._connectionScope
    );

    for (const { event, resolve, reject } of this._queuedEventJobs) {
      this._socket
        .event({ ...event, connectionId })
        .then(resolve)
        .catch(reject);
    }
    this._queuedEventJobs = [];
  };

  _handleSocketError(err: Error) {
    this._emitError(err);
  }

  _handleDisconnect = ({ connectionId }: DisconnectBody) => {
    if (this._connectionId === connectionId) {
      this._connected = false;
      this._emitEvent(
        {
          type: '@disconnect',
          subtype: undefined,
          payload: undefined,
        },
        this._connectionScope
      );
    }
  };

  _handleEvent = ({
    connectionId,
    type,
    subtype,
    payload,
    scopeUId,
  }: EventBody) => {
    if (this._connected === true && this._connectionId === connectionId) {
      let scope = this._connectionScope;
      if (scopeUId) {
        const [platform, scopeType, scopeSubtype, scopeId] = scopeUId.split(
          ':'
        );
        scope =
          platform !== WEBSOCKET
            ? scope
            : scopeType === 'user'
            ? this._userScope || scope
            : scopeType === 'topic'
            ? topicScope(scopeSubtype, scopeId)
            : scope;
      }

      this._emitEvent({ type, subtype, payload }, scope);
    }
  };

  _handleReject = ({ req, reason }: RejectBody) => {
    if (req === this._registerSeq) {
      this._emitError(new ConnectionError(reason));
    }
  };

  _handleConnectFail = ({ req }: DisconnectBody) => {
    if (req === this._registerSeq) {
      const err = new ConnectionError('connect handshake fail');
      this._emitError(err);
    }
  };
}

export default WebScoketClient;
