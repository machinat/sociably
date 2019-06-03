// @flow
/* eslint-disable no-unused-vars */
import type {
  IncomingMessage as HTTP$IncomingMessage,
  ServerResponse as HTTP$ServerResponse,
} from 'http';
import type { Socket as Net$Socket } from 'net';
import $EventEmitter from 'events';
import type { URL as URL$URL, Url as URL$Url } from 'url';

declare module 'ws' {
  declare class Server extends $EventEmitter {
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
    on('close', () => void): void;
    on('connection', (ws: WebSocket, req: HTTP$IncomingMessage) => void): void;
    on('error', (err: Error) => void): void;
    on('headers', (headers: string[], req: HTTP$IncomingMessage) => void): void;
    on('listening', () => void): void;
  }

  declare class WebSocket extends $EventEmitter {
    static Server: Server;

    binaryType: string;
    bufferedAmount: number;
    protocol: string;
    readyState: number;
    url?: string;

    constructor(
      address: string | URL$URL | URL$Url,
      proto: string | string[]
    ): WebSocket;
    send(data: any, options?: Object, callback?: Function): void;
    close(code?: number, reason?: string): void;
    on('close', (code: number, reason: string) => void): void;
    on('error', (err: Error) => void): void;
    on(
      'message',
      (data: string | Buffer | ArrayBuffer | Buffer[]) => void
    ): void;
    on('open', () => void): void;
    on('ping', (data: Buffer) => void): void;
    on('pong', (data: Buffer) => void): void;
    on(
      'unexpected-response',
      (req: HTTP$IncomingMessage, res: HTTP$ServerResponse) => void
    ): void;
    on('upgrade', (req: HTTP$IncomingMessage) => void): void;
  }

  declare module.exports: typeof WebSocket;
}
