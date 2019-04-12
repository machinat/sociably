// @flow
import type Channel from '../channel';
import type WebThread from '../thread';

class Connection {
  channel: Channel;
  thread: void | WebThread;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  _setRegisterSeq(seq: number) {}

  _setThread(thread: WebThread) {
    this.thread = thread;
  }

  send(x: {
    type: string,
    subtype: string,
    payload: any,
    requireAnswer: boolean,
  }) {}
}
