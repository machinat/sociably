// @flow
/* eslint-disable no-bitwise */
import EventEmitter from 'events';
import thenifiedly from 'thenifiedly';
import type WebSocket from 'ws';

import { ConnectionError } from './error';
import type { RequestInfo, ChannelId, ThreadUid } from './types';

/**
 * Mahcinat Web Protocle v0
 *
 * The machinat-web builds on WebSocket to provide a Machinat interface to
 * send and receive events for client side applications.
 *
 * warning: this is just an alpha attemption, and will be rewritten at beta.
 *
 * Glossary:
 *  - Thread: user defined MachinatThread which reflect a "topic" where events
 *            can be published onto
 *  - Event:  user defined MachinatEvent which happen on specified Thread
 *  - Server: the central server to receive events from Client and publish
 *            events of specified threads
 *  - Client: client connects to one or miltiple threads, can send/receive
 *            events of the connected threads to/from Server
 *  - Channel: the underlying tunnel for multiplexing transmit events of
 *             different threads
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
 * sequence: number, the message sequence on the channel it transmitted on
 * body: object, body object correponded to the frame type
 */

const FRAME_EVENT = 'event';
const FRAME_ANSWER = 'answer';
const FRAME_REJECT = 'reject';
const FRAME_REGISTER = 'register';
const FRAME_CONNECT = 'connect';
const FRAME_DISCONNECT = 'disconnect';

/**
 * Event Frame carries a event which happens on a specified thread
 */
export type EventBody = {
  uid: ThreadUid,
  type: string,
  subtype?: string,
  payload: any,
  requireAnswer: boolean,
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
  code: number,
  reason: string,
  payload: any,
};

/**
 * Register Frame register a client to a thread
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
  uid: ThreadUid,
  token?: string,
};

/**
 * Disconnect Frame initiate a disconnect handshake or make a confirmation to
 * the disconnect frame received from Server/Client
 */
export type DisconnectBody = {
  req?: number, // the disconnect frame seq received if it's a confirmation
  uid: ThreadUid,
};

/**
 * Communication
 *
 * Connect Handshake: this connect a client to one thread
 *
 *  +---------+             +---------+
 *  | Client  |             | Server  |
 *  +---------+             +---------+
 *       |                       |
 *       | REGISTER (auth)       |
 *       |---------------------->|
 *       |                       |
 *       |                       | verify auth
 *       |                       |------------
 *       |                       |           |
 *       |                       |<-----------
 *       |                       | --------------------------\
 *       |                       |-| or initiative by Server |
 *       |                       | |-------------------------|
 *       |                       |
 *       |      CONNECT (thread) |
 *       |<----------------------|
 *       |                       |
 *       | CONNECT (thread)      |
 *       |---------------------->|
 *       |                       | -----------------------\
 *       |                       |-| ok to emit event now |
 *       |                       | |----------------------|
 *       |        EVENT (thread) |
 *       |<----------------------|
 *       |                       |
 *
 * Disconnect Handshake: disconnect client from a thread, this can be initiate
 *                       on both Client and Server
 *
 *                        +---------+                +---------+
 *                        | Client  |                | Server  |
 *                        +---------+                +---------+
 *                             |                          |
 *                             |      DISCONNECT (thread) |
 *                             |<-------------------------|
 * --------------------------\ |                          |
 * | event before DISCONNECT |-|                          |
 * | echoed back still count | |                          |
 * |-------------------------| |                          |
 *                             |                          |
 *                             | EVENT (thread)           |
 *                             |------------------------->|
 *                             |                          |
 *                             | DISCONNECT (thread)      |
 *                             |------------------------->|
 *                             |                          |
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

type WithChannel = { channel: Channel }; // eslint-disable-line no-use-before-define

function handleWSMessage(data: any) {
  (this: WithChannel).channel._handlePacket(data);
}

function handleWSOpen() {
  (this: WithChannel).channel.emit('open');
}

function handleWSClose(code, reason) {
  const { channel } = (this: WithChannel);

  for (const [uid, state] of channel.connectStates.entries()) {
    if (state === STATE_CONNECTED_OK) {
      this.emit('disconnect', { uid });
    }
  }

  channel.connectStates.clear();
  channel.emit('close', code, reason);
}

function handleWSError(err) {
  (this: WithChannel).channel.emit('error', err);
}

/**
 * Channel encapsulate protocol detail and provide a high level api for
 * communicating operatiom and notification
 */
class Channel extends EventEmitter {
  id: ChannelId;
  socket: WebSocket;
  isClient: boolean;
  request: void | RequestInfo;

  _seq: number;

  connectStates: Map<ThreadUid, number>;
  _handshakeTimeouts: Map<ThreadUid, TimeoutID>;

  constructor(socket: WebSocket, id: ChannelId, request?: RequestInfo) {
    super();

    this.id = id;
    this.socket = socket;
    this.request = request;
    this.isClient = !request;
    this._seq = 0;

    this.connectStates = new Map();
    this._handshakeTimeouts = new Map();

    socket.channel = this; // eslint-disable-line no-param-reassign
    socket.on('message', handleWSMessage);
    socket.on('open', handleWSOpen);
    socket.on('close', handleWSClose);
    socket.on('error', handleWSError);
  }

  isReady() {
    return this.socket.readyState === SOCKET_OPEN;
  }

  isConnectedTo(uid: ThreadUid): boolean {
    const state = this.connectStates.get(uid);
    return (
      this.socket.readyState === SOCKET_OPEN && state === STATE_CONNECTED_OK
    );
  }

  isConnectingTo(uid: ThreadUid): boolean {
    const state = this.connectStates.get(uid);
    return (
      this.socket.readyState === SOCKET_OPEN &&
      state !== undefined &&
      !!(state & MASK_CONNECTING)
    );
  }

  isDisconnetingTo(uid: ThreadUid) {
    const state = this.connectStates.get(uid);
    return (
      this.socket.readyState === SOCKET_OPEN &&
      state !== undefined &&
      !!(state & MASK_DISCONNECTING)
    );
  }

  _outdateHandshake = (uid: ThreadUid, req: number) => {
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

  _addHandshakeTimeout(uid: ThreadUid, req?: number) {
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
    if (this.socket.readyState !== SOCKET_OPEN) {
      throw new ConnectionError();
    }

    const seq = this._seq;
    this._seq += 1;

    const packet = JSON.stringify([frame, seq, body]);

    if (this.isClient) {
      this.socket.send(packet);
    } else {
      await thenifiedly.callMethod('send', this.socket, packet);
    }

    return seq;
  }

  event(body: EventBody): Promise<number> {
    const { uid } = body;

    const state = this.connectStates.get(uid);
    if (state !== STATE_CONNECTED_OK) {
      throw new ConnectionError();
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
      throw new ConnectionError();
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
      throw new ConnectionError();
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
      throw new ConnectionError();
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
      this.reject().catch(this._emitError);
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
      this.emit('action', body, seq);
    } else {
      this.reject().catch(this._emitError);
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
      this.reject().catch(this._emitError);
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
        // disallow starting connect handshake from client
        this.disconnect({ uid, req: seq }).catch(this._emitError);
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
      this.reject().catch(this._emitError);
    } else if (state & FLAG_DISCONNECT_SENT) {
      // DISCONNECT confirmed, remove state
      this._accomplishDisconnect(body, seq);
    } else {
      // echo back to finish handshake
      this.connectStates.set(uid, state | FLAG_DISCONNECT_RECEIVED);
      this.disconnect({ uid, req: seq }).catch(this._emitError);
    }
  }
}

export default Channel;