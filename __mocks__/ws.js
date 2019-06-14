import moxy from 'moxy';
import EventEmitter from 'events';

function WebSocket() {
  const ws = Object.create(EventEmitter.prototype);
  ws.readyState = 1;

  ws.send = (body, cb) => {
    cb();
  };

  ws.close = (code, reason) => {
    setTimeout(() => {
      ws.emit('close', code, reason);
    }, 10);
  };

  return ws;
}

WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

WebSocket.Server = function WebSocketServer() {};

module.exports = moxy(WebSocket, { excludeProps: ['_*'] });
