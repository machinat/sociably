import moxy from 'moxy';

const _socket = jest.requireActual('../socket');
const Socket = _socket.default;

export default moxy(Socket, {
  excludeProps: ['_*'],
});

export const {
  SOCKET_OPEN,
  SOCKET_CONNECTING,
  SOCKET_CLOSING,
  SOCKET_CLOSED,
} = _socket;
