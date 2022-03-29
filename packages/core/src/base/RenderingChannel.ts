import { makeInterface } from '../service';
import type { MachinatChannel } from '../types';

type RenderingChannelI = null | MachinatChannel;

const RenderingChannelI = makeInterface<RenderingChannelI>({
  name: 'RenderingChannel',
});

export default RenderingChannelI;
