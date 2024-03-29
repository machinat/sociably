/* eslint-disable class-methods-use-this */
import { moxy } from '@moxyjs/moxy';
import EventEmitter from 'events';

class WebSocket extends EventEmitter {
  readyState = 1;

  send(body, cb) {
    cb();
  }

  ping() {}

  close(code, reason) {
    setTimeout(() => {
      this.emit('close', code, reason);
    }, 10);
  }
}

Object.assign(WebSocket, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  Server: class WebSocketServer {},
});

module.exports = moxy(WebSocket);
