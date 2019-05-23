// @flow
/* eslint-disable no-bitwise */
import EventEmitter from 'events';
import thenifiedly from 'thenifiedly';
import type WebSocket from 'ws';

import { ConnectionError } from './error';
import type { RequestInfo, SocketId, ChannelUid } from './types';

/**
 * Mahcinat Web Protocle v0
 *
 * The machinat-web builds on WebSocket to provide a Machinat interface to
 * send and receive events for client side applications.
 *
 * warning: this is just an alpha attemption, and will be rewritten at beta.
 *
 * Glossary:
 *  - Channel: user defined MachinatChannel which reflect a "topic" where events
 *             can be published onto
 *  - Event:   user defined MachinatEvent which happen on specified Channel
 *  - Server:  the central server to receive events from Client and publish
 *             events of specified channels
 *  - Client:  client connects to one or miltiple channels, can send/receive
 *             events of the connected channels to/from Server
 *  - Socket:  the underlying tunnel for multiplexing events of different
 *             channels
 */

/* eslint-disable no-unused-vars */
const SOCKET_CONNECTING = 0;
const SOCKET_OPEN = 1;
const SOCKET_COSING = 2;
const SOCKET_CLOSED = 3;
/* eslint-enable no-unused-vars */

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
 * Event Frame carries a event which happens on a specified channel
 */
export type EventBody = {
  uid: ChannelUid,
  type: string,
  subtype?: string,
  payload: any,
  requireAnswer?: boolean,
};

/**
 * Answer Frame make a reply to an event transmitted before if needed
 */
export type AnswerBody = {
  req: number, // seq of the answered event
  payload: any,
};

/**
 * Reject Frame reject an illegal frame transmitted before
 */
export type RejectBody = {
  req: number, // seq of the rejected frame
  // code: number,
  reason: string,
};

/**
 * Register Frame register a client to a channel
 */
export type RegisterBody = {
  type: string,
  [string]: any,
};

/**
 * Connect Frame initiate a connect handshake from Server or make a confirmation
 * to the connect frame received from Client
 */
export type ConnectBody = {
  // the register frame seq on server, or the connect frame seq on client
  req?: number,
  uid: ChannelUid,
  token?: string,
};

/**
 * Disconnect Frame initiate a disconnect handshake or make a confirmation to
 * the disconnect frame received from Server/Client
 */
export type DisconnectBody = {
  req?: number, // the disconnect frame seq received if it's a confirmation
  uid: ChannelUid,
  // code: number,
  reason: string,
};

/**
 * Communication
 *
 * Connect Handshake: this connect a client to one channel
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
 * Disconnect Handshake: disconnect client from a channel, this can be initiate
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
  (this: WithSocket).socket._handlePacket(data);
}

function handleWSOpen() {
  (this: WithSocket).socket.emit('open');
}

function handleWSClose(code, reason) {
  const { socket } = (this: WithSocket);

  for (const [uid, state] of socket.connectStates.entries()) {
    if (state === STATE_CONNECTED_OK) {
      this.emit('disconnect', { uid });
    }
  }

  socket.connectStates.clear();
  socket.emit('close', code, reason);
}

function handleWSError(err) {
  (this: WithSocket).socket.emit('error', err);
}

/**
 * Socket encapsulate protocol detail and provide a high level api for
 * communicating operatiom and notification
 */
class MachinatSocket extends EventEmitter {
  id: SocketId;
  _ws: WebSocket;

  isClient: boolean;
  request: void | RequestInfo;

  _seq: number;

  connectStates: Map<ChannelUid, number>;
  _handshakeTimeouts: Map<ChannelUid, TimeoutID>;

  constructor(ws: WebSocket, id: SocketId, request?: RequestInfo) {
    super();

    this.id = id;
    this._ws = ws;
    this.request = request;
    this.isClient = !request;
    this._seq = 0;

    this.connectStates = new Map();
    this._handshakeTimeouts = new Map();

    ws.socket = this; // eslint-disable-line no-param-reassign
    ws.on('message', handleWSMessage);
    ws.on('open', handleWSOpen);
    ws.on('close', handleWSClose);
    ws.on('error', handleWSError);
  }

  isReady() {
    return this._ws.readyState === SOCKET_OPEN;
  }

  isConnectedTo(uid: ChannelUid): boolean {
    const state = this.connectStates.get(uid);
    return this._ws.readyState === SOCKET_OPEN && state === STATE_CONNECTED_OK;
  }

  isConnectingTo(uid: ChannelUid): boolean {
    const state = this.connectStates.get(uid);
    return (
      this._ws.readyState === SOCKET_OPEN &&
      state !== undefined &&
      !!(state & MASK_CONNECTING)
    );
  }

  isDisconnetingTo(uid: ChannelUid) {
    const state = this.connectStates.get(uid);
    return (
      this._ws.readyState === SOCKET_OPEN &&
      state !== undefined &&
      !!(state & MASK_DISCONNECTING)
    );
  }

  _outdateHandshake = (uid: ChannelUid, req?: number) => {
    const state = this.connectStates.get(uid);
    if (state !== undefined && state !== STATE_CONNECTED_OK) {
      this.connectStates.delete(uid);

      if (state & MASK_CONNECTING) {
        this.emit('connect_fail', { uid, req }, req);
      } else {
        this.emit('disconnect', { uid, req }, req);
      }
    }

    this._handshakeTimeouts.delete(uid);
  };

  _addHandshakeTimeout(uid: ChannelUid, req?: number) {
    if (this._handshakeTimeouts.has(uid)) {
      return;
    }

    const state = this.connectStates.get(uid);
    if (state !== undefined) {
      this.connectStates.set(uid, state | FLAG_OUTDATING);
    }

    const timeoutId = setTimeout(
      this._outdateHandshake,
      HANDSHAKE_TIMEOUT,
      uid,
      req
    );
    this._handshakeTimeouts.set(uid, timeoutId);
  }

  _accomplishConnect(body: ConnectBody, seq: number) {
    this.emit('connect', body, seq);

    const { uid } = body;
    this.connectStates.set(uid, STATE_CONNECTED_OK);

    const timeoutId = this._handshakeTimeouts.get(uid);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this._handshakeTimeouts.delete(uid);
    }
  }

  _accomplishDisconnect(body: DisconnectBody, seq?: number) {
    const { uid } = body;
    const state = this.connectStates.get(uid);

    if (state === undefined || state & MASK_CONNECTING) {
      this.emit('connect_fail', body, seq);
    } else {
      this.emit('disconnect', body, seq);
    }

    this.connectStates.delete(uid);

    const timeoutId = this._handshakeTimeouts.get(uid);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this._handshakeTimeouts.delete(uid);
    }
  }

  async _send(frame: string, body: Object): Promise<number> {
    if (this._ws.readyState !== SOCKET_OPEN) {
      throw new ConnectionError('the underlying WebSocket is not opened');
    }

    const seq = this._seq;
    this._seq += 1;

    const packet = JSON.stringify([frame, seq, body]);

    if (this.isClient) {
      this._ws.send(packet);
    } else {
      await thenifiedly.callMethod('send', this._ws, packet);
    }

    return seq;
  }

  event(body: EventBody): Promise<number> {
    const { uid } = body;

    const state = this.connectStates.get(uid);
    if (state !== STATE_CONNECTED_OK) {
      throw new ConnectionError(
        `channel(${uid}) is not connected or is disconnecting`
      );
    }

    return this._send(FRAME_EVENT, body);
  }

  answer(body: AnswerBody): Promise<number> {
    return this._send(FRAME_ANSWER, body);
  }

  reject(body: RejectBody): Promise<number> {
    return this._send(FRAME_REJECT, body);
  }

  register(body: RegisterBody): Promise<number> {
    if (!this.isClient) {
      throw new ConnectionError("can't send register on server to a client");
    }

    return this._send(FRAME_REGISTER, body);
  }

  // initiate CONNECT handshake
  async connect(body: ConnectBody): Promise<number> {
    const { uid, req } = body;

    let state = this.connectStates.get(uid);
    // throw if already connected or disconnecting or waiting for CONNECT echo
    if (
      state === STATE_CONNECTED_OK ||
      (state !== undefined &&
        (state & MASK_DISCONNECTING || state & FLAG_CONNECT_SENT))
    ) {
      throw new ConnectionError(`channel(${uid}) already connected`);
    }

    this._addHandshakeTimeout(uid, req);
    const seq = await this._send(FRAME_CONNECT, body);

    state = this.connectStates.get(uid);

    if (state !== undefined) {
      if (state & FLAG_CONNECT_RECEIVED && !(state & MASK_DISCONNECTING)) {
        // CONNECT handshake finished
        this._accomplishConnect(body, seq);
      } else {
        // set flag and wait for CONNECT echo
        this.connectStates.set(uid, state & FLAG_CONNECT_SENT);
      }
    }

    return seq;
  }

  // initiate DISCONNECT handshake
  async disconnect(body: DisconnectBody): Promise<void | number> {
    const { uid, req } = body;

    let state = this.connectStates.get(uid);
    if (state === undefined) {
      // throw if not even connecting
      throw new ConnectionError(
        `socket[${this.id}] didn't connect to channel[${uid}]`
      );
    } else if (state & FLAG_DISCONNECT_SENT) {
      // return nothing while waiting for echo
      return undefined;
    }

    this._addHandshakeTimeout(uid, req);
    const seq = await this._send(FRAME_DISCONNECT, body);

    this.connectStates.set(uid, state | FLAG_DISCONNECT_SENT);

    state = this.connectStates.get(uid);
    if (state !== undefined && state & FLAG_DISCONNECT_RECEIVED) {
      // DISCONNECT handshake finished
      this._accomplishDisconnect(body, seq);
    }

    return seq;
  }

  _handlePacket(data: string) {
    const [frameType, seq, body] = JSON.parse(data);

    this._seq = seq + 1;

    if (frameType === FRAME_EVENT) {
      this._handleEvent(body, seq);
    } else if (frameType === FRAME_ANSWER) {
      this._handleAnswer(body, seq);
    } else if (frameType === FRAME_REJECT) {
      this._handleReject(body, seq);
    } else if (frameType === FRAME_REGISTER) {
      this._handleRegister(body, seq);
    } else if (frameType === FRAME_CONNECT) {
      this._handleConnect(body, seq);
    } else if (frameType === FRAME_DISCONNECT) {
      this._handleDisconnect(body, seq);
    } else {
      this.reject({ req: seq, reason: 'unknown frame type' }).catch(
        this._emitError
      );
    }
  }

  _emitError = (err: Error) => {
    this.emit('error', err);
  };

  _handleEvent(body: EventBody, seq: number) {
    const { uid } = body;

    const state = this.connectStates.get(uid);
    if (
      state === STATE_CONNECTED_OK ||
      // accept msg when DISCONNECT sent but not yet echoed back
      (state !== undefined &&
        !(state & MASK_CONNECTING) &&
        !(state & FLAG_DISCONNECT_RECEIVED))
    ) {
      this.emit('event', body, seq);
    } else {
      this.reject({ req: seq, reason: 'channel not connected' }).catch(
        this._emitError
      );
    }
  }

  _handleReject(body: RejectBody, seq: number) {
    this.emit('reject', body, seq);
  }

  _handleAnswer(body: AnswerBody, seq: number) {
    this.emit('answer', body, seq);
  }

  _handleRegister(body: RegisterBody, seq: number) {
    if (this.isClient) {
      this.reject({
        req: seq,
        reason: 'not accepet register to a client',
      }).catch(this._emitError);
    } else {
      this.emit('register', body, seq);
    }
  }

  _handleConnect(body: ConnectBody, seq: number) {
    const { uid } = body;

    const state = this.connectStates.get(uid);
    if (state === undefined) {
      // handle fresh connect initiation
      this.connectStates.set(uid, FLAG_CONNECT_RECEIVED);

      if (this.isClient) {
        // confirm on client side
        this.connect({ uid, req: seq }).catch(this._emitError);
      } else {
        // disallow initiating connect handshake from client
        this.disconnect({
          uid,
          req: seq,
          reason: 'initiate connect handshake from client is not allowed',
        }).catch(this._emitError);
      }
    } else if (state & FLAG_CONNECT_SENT && !(state & MASK_DISCONNECTING)) {
      // CONNECT confirmed, set as connected
      this._accomplishConnect(body, seq);
    } else {
      // if disconnecting while connecting, add flag and do nothing
      this.connectStates.set(uid, state | FLAG_CONNECT_RECEIVED);
    }
  }

  _handleDisconnect(body: DisconnectBody, seq: number) {
    const { uid } = body;

    const state = this.connectStates.get(uid);
    if (state === undefined) {
      // reject if not even start connecting
      this.reject({
        req: seq,
        reason: 'channel not connected or connecting',
      }).catch(this._emitError);
    } else if (state & FLAG_DISCONNECT_SENT) {
      // DISCONNECT confirmed, remove state
      this._accomplishDisconnect(body, seq);
    } else {
      // echo back to finish handshake
      this.connectStates.set(uid, state | FLAG_DISCONNECT_RECEIVED);
      this.disconnect({ uid, req: seq, reason: 'confirmed' }).catch(
        this._emitError
      );
    }
  }
}

export default MachinatSocket;
