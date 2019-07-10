import moxy from 'moxy';

const Socket = jest.requireActual('../socket').default;

export default moxy(Socket, {
  excludeProps: ['_*'],
});

export const {
  SOCKET_OPEN,
  SOCKET_CONNECTING,
  SOCKET_CLOSING,
  SOCKET_CLOSED,
} = Socket;
