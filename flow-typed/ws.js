// @flow
/* eslint-disable no-unused-vars */
import type {
  IncomingMessage as HTTP$IncomingMessage,
  ServerResponse as HTTP$ServerResponse,
} from 'http';
import type { Socket as Net$Socket } from 'net';
import EventEmitter from 'events';
import type { URL as URL$URL, Url as URL$Url } from 'url';

declare module 'ws' {
  declare class Server extends EventEmitter {
    constructor(options?: Object, callback?: Function): Server;
    clients: Set<WebSocket>;
    address(): { port: number, address: string, family: string };
    close(callback?: Function): void;
    handleUpgrade(
      req: HTTP$IncomingMessage,
      socket: Net$Socket,
      head: Buffer,
      callback?: Function
    ): void;
    shouldHandle(req: HTTP$IncomingMessage): boolean;
    on('close', () => {}): void;
    on('connection', (ws: WebSocket, req: HTTP$IncomingMessage) => {}): void;
    on('error', (err: Error) => {}): void;
    on('headers', (headers: string[], req: HTTP$IncomingMessage) => {}): void;
    on('listening', () => {}): void;
  }

  declare class WebSocket extends EventEmitter {
    static Server: Server;
    constructor(address: string | URL$URL | URL$Url): WebSocket;
    send(data: any, options?: Object, callback?: Function): void;
    close(code?: number, reason?: string): void;
    on('close', (code: number, reason: string) => {}): void;
    on('error', (err: Error) => {}): void;
    on('message', (data: string | Buffer | ArrayBuffer | Buffer[]) => {}): void;
    on('open', () => {}): void;
    on('ping', (data: Buffer) => {}): void;
    on('pong', (data: Buffer) => {}): void;
    on(
      'unexpected-response',
      (req: HTTP$IncomingMessage, res: HTTP$ServerResponse) => {}
    ): void;
    on('upgrade', (req: HTTP$IncomingMessage) => {}): void;
  }

  declare module.exports: typeof WebSocket;
}
