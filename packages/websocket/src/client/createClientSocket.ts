// eslint-disable-next-line spaced-comment
/// <reference lib="DOM" />
/** @internal */ /** */
import { EventEmitter } from 'events';
import Socket from '../socket';
import SocketError from '../error';

const Ws =
  typeof WebSocket === 'undefined'
    ? require('ws')
    : class EmittableWebSocket extends EventEmitter {
        _ws: WebSocket;

        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;

        constructor(url, protocols) {
          super();

          const webSocket = new WebSocket(url, protocols);

          webSocket.onmessage = (e) => {
            this.emit('message', e.data);
          };

          webSocket.onclose = (e) => {
            this.emit('close', e.code, e.reason);
          };

          webSocket.onerror = (e: ErrorEvent) => {
            this.emit('error', new SocketError(e.message));
          };

          webSocket.onopen = () => {
            this.emit('open');
          };

          this._ws = webSocket;
        }

        get binaryType() {
          return this._ws.binaryType;
        }

        set binaryType(t) {
          this._ws.binaryType = t;
        }

        get bufferedAmount() {
          return this._ws.bufferedAmount;
        }

        get extensions() {
          return this._ws.extensions;
        }

        get protocol() {
          return this._ws.protocol;
        }

        get readyState() {
          return this._ws.readyState;
        }

        get url() {
          return this._ws.url;
        }

        send(data, callback) {
          this._ws.send(data);
          callback();
        }

        close(code, reason) {
          this._ws.close(code, reason);
        }
      };

const MACHINAT_WEBSOCKET_PROTOCOL_V0 = 'machinat-websocket-v0';

const createClientSocket = (url: string): Promise<Socket> => {
  const ws = new Ws(url, MACHINAT_WEBSOCKET_PROTOCOL_V0);
  const socket = new Socket(ws);

  return new Promise((resolve, reject) => {
    let errorListener;
    const openListener = () => {
      resolve(socket);
      socket.removeListener('open', openListener);
      socket.removeListener('error', errorListener);
    };
    errorListener = (err) => {
      reject(err);
      socket.removeListener('open', openListener);
      socket.removeListener('error', errorListener);
    };
    socket.on('open', openListener);
    socket.on('error', errorListener);
  });
};

export default createClientSocket;
