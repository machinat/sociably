// @flow
import EventEmitter from 'events';
import thenifiedly from 'thenifiedly';
import type WebSocket from 'ws';

import { ConnectionError } from './error';
import type { RequestInfo, ConnectionId } from './types';

/**
 * Mahcinat WebSocket Protocle v0
 *
 * The machinat-websocket builds on WebSocket to provide a Machinat interface to
 * send and receive events for client side applications.
 *
 * Glossary:
 *  - Socket:     the underlying tunnel which encapsulate a real WebSocket with
 *                defined prorocol to multiplexedly communicate over connections
 *  - Connection: virtual entity to send or receive event over
 *  - Channel:    a scope of a collection of connections for sending event to
 *  - Event:      an user defined MachinatEvent, sends over a connection
 *                bidirectionally
 *  - Server:     the central server receive/publish events from/to Client
 *  - Client:     client hold a connection and manage event reciving/sendering
 *                at front-end
 */

export const SOCKET_CONNECTING = 0;
export const SOCKET_OPEN = 1;
export const SOCKET_CLOSING = 2;
export const SOCKET_CLOSED = 3;

/**
 * Format
 *
 * In v0 all messages transmitted in plain text of JSON format for the ease of
 * implementation temporarily, the formation looks like:
 *
 * [frameType, sequence, body]
 *
 * frameType: string, type of a frame
 * sequence: number, the message sequence on the socket it transmitted on
 * body: object, body object correponded to the frame type
 */

const FRAME_EVENT = 'event';
const FRAME_ANSWER = 'answer';
const FRAME_REJECT = 'reject';
const FRAME_REGISTER = 'register';
const FRAME_CONNECT = 'connect';
const FRAME_DISCONNECT = 'disconnect';

/**
 * Event Frame carries a event which delivered with a specified connection
 */
export type EventBody = {|
  connectionId: ConnectionId,
  type: string,
  subtype?: string,
  payload: any,
  requireAnswer?: boolean,
  scopeUId?: string,
|};

/**
 * Answer Frame make a reply to an event transmitted before if needed
 */
export type AnswerBody = {|
  req: number, // seq of the answered event
  payload: any,
|};

/**
 * Reject Frame reject an illegal frame transmitted before
 */
export type RejectBody = {|
  req: number, // seq of the rejected frame
  // code: number,
  reason: string,
|};

/**
 * Register Frame request for registering a connection
 */
export type RegisterBody = {|
  type: string,
  auth: Object,
|};

/**
 * Connect Frame initiate a connect handshake from Server or make a confirmation
 * to the connect frame received from Client
 */
export type ConnectBody = {|
  req: number, // the responding "register" seq on server, "connect" seq on client
  connectionId: ConnectionId,
|};

/**
 * Disconnect Frame initiate a disconnect handshake or make a confirmation to
 * the disconnect frame received from Server/Client
 */
export type DisconnectBody = {|
  req?: number, // the disconnect frame seq received if it's a confirmation
  connectionId: ConnectionId,
  // code: number,
  reason: string,
|};

/**
 * Communication
 *
 * Connect Handshake: this initiate a connection
 *
 *  +---------+             +---------+
 *  | Client  |             | Server  |
 *  +---------+             +---------+
 *       |                        |
 *       | REGISTER (auth)        |
 *       |----------------------->|
 *       |                        |
 *       |                        | verify auth
 *       |                        |------------
 *       |                        |           |
 *       |                        |<-----------
 *       |                        | --------------------------\
 *       |                        |-| or initiative by Server |
 *       |                        | |-------------------------|
 *       |                        |
 *       |      CONNECT (channel) |
 *       |<-----------------------|
 *       |                        |
 *       | CONNECT (channel)      |
 *       |----------------------->|
 *       |                        | -----------------------\
 *       |                        |-| ok to emit event now |
 *       |                        | |----------------------|
 *       |        EVENT (channel) |
 *       |<-----------------------|
 *       |                        |
 *
 * Disconnect Handshake: disconnect a connected connection, this can be initiate
 *                       on both Client and Server
 *
 *                        +---------+                +---------+
 *                        | Client  |                | Server  |
 *                        +---------+                +---------+
 *                             |                           |
 *                             |      DISCONNECT (channel) |
 *                             |<--------------------------|
 * --------------------------\ |                           |
 * | event before DISCONNECT |-|                           |
 * | echoed back still count | |                           |
 * |-------------------------| |                           |
 *                             |                           |
 *                             | EVENT (channel)           |
 *                             |-------------------------->|
 *                             |                           |
 *                             | DISCONNECT (channel)      |
 *                             |-------------------------->|
 *                             |                           |
 *
 * Event & Answer: emit event and make answer to an emmited event (optional),
 *
 *  +---------+                  +---------+
 *  | Client  |                  | Server  |
 *  +---------+                  +---------+
 *       |                            |
 *       | EVENT                      |
 *       | (requireAnswer:true)       |
 *       |--------------------------->|
 *       |                            | ---------------------\
 *       |                            |-| answer if required |
 *       |                            | |--------------------|
 *       |                            |
 *       |               ANSWER (seq) |
 *       |<---------------------------|
 *       |                            |
 *       |                      EVENT |
 *       |      (requireAnswer:false) |
 *       |<---------------------------|
 *       |                            |

 */

const STATE_CONNECTED_OK = 0;

const FLAG_CONNECT_SENT = 1;
const FLAG_CONNECT_RECEIVED = 1 << 1;
const FLAG_DISCONNECT_SENT = 1 << 2;
const FLAG_DISCONNECT_RECEIVED = 1 << 3;
const FLAG_OUTDATING = 1 << 4;

const MASK_CONNECTING = FLAG_CONNECT_SENT | FLAG_CONNECT_RECEIVED;
const MASK_DISCONNECTING = FLAG_DISCONNECT_SENT | FLAG_DISCONNECT_RECEIVED;

const HANDSHAKE_TIMEOUT = 20 * 1000;

type WithSocket = { socket: MachinatSocket }; // eslint-disable-line no-use-before-define

function handleWSMessage(data: any) {
  const { socket } = (this: WithSocket);
  socket._handlePacket(data).catch(socket._emitError);
}

function handleWSOpen() {
  (this: WithSocket).socket._emitOpen();
}

function handleWSClose(code, reason) {
  const { socket } = (this: WithSocket);
  socket._emitClose(code, reason);
}

function handleWSError(err) {
  (this: WithSocket).socket._emitError(err);
}

/**
 * Socket encapsulate protocol detail and provide a high level api for
 * communicating operation and notification
 */
class MachinatSocket extends EventEmitter {
  id: string;
  isClient: boolean;
  request: RequestInfo;

  _ws: WebSocket;
  _seq: number;

  _connectStates: Map<ConnectionId, number>;
  _handshakeTimeouts: Map<ConnectionId, TimeoutID>;

  constructor(id: string, ws: WebSocket, request: RequestInfo) {
    super();

    this.id = id;
    this.request = request;
    this.isClient = !request;
    this._ws = ws;
    this._seq = 0;

    this._connectStates = new Map();
    this._handshakeTimeouts = new Map();

    ws.socket = this; // eslint-disable-line no-param-reassign
    ws.on('message', handleWSMessage);
    ws.on('open', handleWSOpen);
    ws.on('close', handleWSClose);
    ws.on('error', handleWSError);
  }

  readyState() {
    return this._ws.readyState;
  }

  isConnected(connectionId: ConnectionId): boolean {
    const state = this._connectStates.get(connectionId);
    return this._ws.readyState === SOCKET_OPEN && state === STATE_CONNECTED_OK;
  }

  isConnecting(connectionId: ConnectionId): boolean {
    const state = this._connectStates.get(connectionId);
    return (
      this._ws.readyState === SOCKET_OPEN &&
      state !== undefined &&
      !!(state & MASK_CONNECTING)
    );
  }

  isDisconnecting(connectionId: ConnectionId) {
    const state = this._connectStates.get(connectionId);
    return (
      this._ws.readyState === SOCKET_OPEN &&
      state !== undefined &&
      !!(state & MASK_DISCONNECTING)
    );
  }

  async event(body: EventBody): Promise<number> {
    const { connectionId } = body;

    const state = this._connectStates.get(connectionId);
    if (state !== STATE_CONNECTED_OK) {
      throw new ConnectionError(
        `connection [${connectionId}] is not connected`
      );
    }

    const seq = await this._send(FRAME_EVENT, body);
    return seq;
  }

  answer(body: AnswerBody): Promise<number> {
    return this._send(FRAME_ANSWER, body);
  }

  reject(body: RejectBody): Promise<number> {
    return this._send(FRAME_REJECT, body);
  }

  async register(body: RegisterBody): Promise<number> {
    if (!this.isClient) {
      throw new ConnectionError("can't register on server side");
    }

    const seq = await this._send(FRAME_REGISTER, body);
    return seq;
  }

  // initiate CONNECT handshake
  async connect(body: ConnectBody): Promise<number> {
    const { connectionId, req } = body;

    let state = this._connectStates.get(connectionId);
    // throw if already connected or disconnecting or waiting for CONNECT echo
    if (
      state === STATE_CONNECTED_OK ||
      (state !== undefined &&
        (state & MASK_DISCONNECTING || state & FLAG_CONNECT_SENT))
    ) {
      throw new ConnectionError(
        `connection [${connectionId}] is already connected`
      );
    }

    this._addHandshakeTimeout(connectionId, req);
    const seq = await this._send(FRAME_CONNECT, body);

    state = this._connectStates.get(connectionId);
    if (state !== undefined) {
      this._connectStates.set(connectionId, state & FLAG_CONNECT_SENT);
    } else {
      this._connectStates.set(connectionId, FLAG_CONNECT_SENT);
    }

    return seq;
  }

  // initiate DISCONNECT handshake
  async disconnect(body: DisconnectBody): Promise<void | number> {
    const { connectionId, req } = body;

    let state = this._connectStates.get(connectionId);
    if (state === undefined) {
      // throw if not even connecting
      throw new ConnectionError(
        `connection [${connectionId}] not existed or already disconnected`
      );
    } else if (state & FLAG_DISCONNECT_SENT) {
      // return nothing while waiting for echo
      return undefined;
    }

    if (state === STATE_CONNECTED_OK) {
      this._addHandshakeTimeout(connectionId, req);
    }

    const seq = await this._send(FRAME_DISCONNECT, body);

    state = this._connectStates.get(connectionId);
    if (state !== undefined) {
      this._connectStates.set(connectionId, state | FLAG_DISCONNECT_SENT);
    }

    return seq;
  }

  close(code: number, reason: string) {
    this._ws.close(code, reason);
  }

  async _send(frame: string, body: Object): Promise<number> {
    const { readyState } = this._ws;
    if (readyState !== SOCKET_OPEN) {
      throw new ConnectionError('socket is not ready');
    }

    this._seq += 1;
    const seq = this._seq;

    const packet = JSON.stringify([frame, seq, body]);

    await thenifiedly.callMethod('send', this._ws, packet);
    return seq;
  }

  _emitError = (err: Error) => {
    this.emit('error', err);
  };

  _emitEvent(body: EventBody, seq: number) {
    this.emit('event', body, seq);
  }

  _emitReject(body: RejectBody, seq: number) {
    this.emit('reject', body, seq);
  }

  _emitAnswer(body: AnswerBody, seq: number) {
    this.emit('answer', body, seq);
  }

  _emitRegister(body: RegisterBody, seq: number) {
    this.emit('register', body, seq);
  }

  _emitConnect(body: ConnectBody, seq: number) {
    this.emit('connect', body, seq);
  }

  _emitConnectFail(body: DisconnectBody, seq?: number) {
    this.emit('connect_fail', body, seq);
  }

  _emitDisconnect(body: DisconnectBody, seq?: number) {
    this.emit('disconnect', body, seq);
  }

  _emitOpen() {
    this.emit('open');
  }

  _emitClose(code: number, reason: string) {
    for (const [connectionId, state] of this._connectStates.entries()) {
      if (state === STATE_CONNECTED_OK || state & MASK_DISCONNECTING) {
        this._emitDisconnect({ connectionId, reason });
      } else if (state & MASK_CONNECTING) {
        this._emitConnectFail({ connectionId, reason });
      }
    }

    for (const timeoutId of this._handshakeTimeouts.values()) {
      clearTimeout(timeoutId);
    }

    this._connectStates.clear();
    this._handshakeTimeouts.clear();

    this.emit('close', code, reason);
  }

  async _handlePacket(data: string) {
    const [frameType, seq, body] = JSON.parse(data);

    this._seq = seq + 1;

    if (frameType === FRAME_EVENT) {
      await this._handleEvent(body, seq);
    } else if (frameType === FRAME_ANSWER) {
      await this._emitAnswer(body, seq);
    } else if (frameType === FRAME_REJECT) {
      await this._emitReject(body, seq);
    } else if (frameType === FRAME_REGISTER) {
      await this._handleRegister(body, seq);
    } else if (frameType === FRAME_CONNECT) {
      await this._handleConnect(body, seq);
    } else if (frameType === FRAME_DISCONNECT) {
      await this._handleDisconnect(body, seq);
    } else {
      await this.reject({ req: seq, reason: 'unknown frame type' });
    }
  }

  async _handleEvent(body: EventBody, seq: number) {
    const { connectionId } = body;

    const state = this._connectStates.get(connectionId);
    if (
      state === STATE_CONNECTED_OK ||
      // accept msg when DISCONNECT sent but not yet echoed back
      (state !== undefined &&
        !(state & MASK_CONNECTING) &&
        !(state & FLAG_DISCONNECT_RECEIVED))
    ) {
      this._emitEvent(body, seq);
    } else {
      await this.reject({ req: seq, reason: 'channel not connected' });
    }
  }

  async _handleRegister(body: RegisterBody, seq: number) {
    if (this.isClient) {
      await this.reject({
        req: seq,
        reason: "can't register to client",
      });
    } else {
      this._emitRegister(body, seq);
    }
  }

  async _handleConnect(body: ConnectBody, seq: number) {
    const { connectionId } = body;

    const state = this._connectStates.get(connectionId);
    if (state === undefined) {
      // handle fresh connect initiation
      this._connectStates.set(connectionId, FLAG_CONNECT_RECEIVED);
      if (this.isClient) {
        // confirm at client side
        await this.connect({ connectionId, req: seq });

        this._accomplishConnect(body, seq);
      } else {
        // disallow initiating connect handshake from client
        await this.disconnect({
          connectionId,
          req: seq,
          reason: 'initiate connect handshake from client is not allowed',
        });

        this._connectStates.delete(connectionId);
      }
    } else if (state & FLAG_CONNECT_SENT && !(state & MASK_DISCONNECTING)) {
      // CONNECT confirmed, set as connected
      this._accomplishConnect(body, seq);
    } else {
      // if disconnecting while connecting, add flag and do nothing
      this._connectStates.set(connectionId, state | FLAG_CONNECT_RECEIVED);
    }
  }

  async _handleDisconnect(body: DisconnectBody, seq: number) {
    const { connectionId } = body;

    const state = this._connectStates.get(connectionId);
    if (state === undefined) {
      // reject if not even start connecting
      await this.reject({
        req: seq,
        reason: 'channel not connected or connecting',
      });
    } else if (state & FLAG_DISCONNECT_SENT || state & MASK_CONNECTING) {
      // DISCONNECT confirmed, remove state
      this._accomplishDisconnect(body, seq);
    } else {
      // echo back to finish handshake
      this._connectStates.set(connectionId, state | FLAG_DISCONNECT_RECEIVED);
      await this.disconnect({ connectionId, req: seq, reason: 'echo' });
      this._accomplishDisconnect(body, seq);
    }
  }

  _outdateHandshake = (connectionId: ConnectionId, req?: number) => {
    const state = this._connectStates.get(connectionId);
    if (state !== undefined && state !== STATE_CONNECTED_OK) {
      this._connectStates.delete(connectionId);

      const reason = 'handshake timeout';
      if (state & MASK_CONNECTING) {
        this._emitConnectFail({ connectionId, req, reason }, req);
      } else {
        this._emitDisconnect({ connectionId, req, reason }, req);
      }
    }

    this._handshakeTimeouts.delete(connectionId);
  };

  _addHandshakeTimeout(connectionId: ConnectionId, req?: number) {
    if (this._handshakeTimeouts.has(connectionId)) {
      return;
    }

    const state = this._connectStates.get(connectionId);
    if (state !== undefined) {
      this._connectStates.set(connectionId, state | FLAG_OUTDATING);
    }

    const timeoutId = setTimeout(
      this._outdateHandshake,
      HANDSHAKE_TIMEOUT,
      connectionId,
      req
    );
    this._handshakeTimeouts.set(connectionId, timeoutId);
  }

  _accomplishConnect(body: ConnectBody, seq: number) {
    this._emitConnect(body, seq);

    const { connectionId } = body;
    this._connectStates.set(connectionId, STATE_CONNECTED_OK);

    const timeoutId = this._handshakeTimeouts.get(connectionId);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this._handshakeTimeouts.delete(connectionId);
    }
  }

  _accomplishDisconnect(body: DisconnectBody, seq?: number) {
    const { connectionId } = body;
    const state = this._connectStates.get(connectionId);

    if (state === undefined || state & MASK_CONNECTING) {
      this._emitConnectFail(body, seq);
    } else {
      this._emitDisconnect(body, seq);
    }

    this._connectStates.delete(connectionId);

    const timeoutId = this._handshakeTimeouts.get(connectionId);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this._handshakeTimeouts.delete(connectionId);
    }
  }
}

export default MachinatSocket;
