import EventEmitter from 'events';
import { ConnectionError } from '../error';

let ws;

if (typeof WebSocket !== 'undefined') {
  class EmittableWebSocket extends EventEmitter {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url, protocols) {
      super();

      const webSocket = new WebSocket(url, protocols); // eslint-disable-line no-undef

      webSocket.onmessage = e => {
        this.emit('message', e.data);
      };

      webSocket.onclose = e => {
        this.emit('close', e.code, e.reason);
      };

      webSocket.onerror = e => {
        this.emit('error', new ConnectionError(e.message));
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
  }

  ws = EmittableWebSocket;
} else {
  ws = require('ws'); // eslint-disable-line global-require
}

module.exports = ws;
