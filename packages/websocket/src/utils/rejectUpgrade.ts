import { STATUS_CODES } from 'http';
import type { Socket as NetSocket } from 'net';

const rejectUpgrade = (ns: NetSocket, code: number, message?: string): void => {
  const codeName = STATUS_CODES[code]!;
  const body = message || codeName;

  ns.write(
    `HTTP/1.1 ${code} ${codeName}\r\n` +
      'Connection: close\r\n' +
      'Content-Type: text/html\r\n' +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      `\r\n${body}`
  );

  ns.destroy();
};

export default rejectUpgrade;
