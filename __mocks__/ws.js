/* eslint-disable class-methods-use-this */
import moxy from 'moxy';
import EventEmitter from 'events';

class WebSocket extends EventEmitter {
  readyState = 1;

  send(body, cb) {
    cb();
  }

  close(code, reason) {
    setTimeout(() => {
      this.emit('close', code, reason);
    }, 10);
  }
}

WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

WebSocket.Server = class WebSocketServer {};

module.exports = moxy(WebSocket, { excludeProps: ['_*'] });
