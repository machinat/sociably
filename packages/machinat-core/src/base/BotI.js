// @flow
/* eslint-disable class-methods-use-this */
import type { MachinatBot, MachinatChannel, MachinatNode } from '../types';
import type { DispatchResponse } from '../engine/types';
import { abstractInterface } from '../service';

class AbstractBot<Channel: MachinatChannel, Job, Result>
  implements MachinatBot<Channel, Job, Result> {
  render(
    _channel: Channel,
    _node: MachinatNode
  ): Promise<null | DispatchResponse<Job, Result>> {
    throw new TypeError('method called on abstract class');
  }

  start(): Promise<void> {
    throw new TypeError('method called on abstract class');
  }

  stop(): Promise<void> {
    throw new TypeError('method called on abstract class');
  }
}

export default abstractInterface<AbstractBot<any, any, any>>({
  name: 'BaseBot',
})(AbstractBot);
