// @flow
import type { MachinatBot, MachinatChannel, MachinatNode } from '../types';
import type { DispatchResponse } from '../engine/types';
import { abstractInterface } from '../service';

class AbstractBot<Channel: MachinatChannel, Job, Result>
  implements MachinatBot<Channel, Job, Result> {
  +render: (
    Channel,
    MachinatNode
  ) => Promise<null | DispatchResponse<Job, Result>>;

  +start: () => Promise<void>;
  +stop: () => Promise<void>;
}

export default abstractInterface<AbstractBot<any, any, any>>()(AbstractBot);
