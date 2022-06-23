import { makeInterface } from '../service';
import type { SociablyChannel } from '../types';

type RenderingChannelI = null | SociablyChannel;

const RenderingChannelI = makeInterface<RenderingChannelI>({
  name: 'RenderingChannel',
});

export default RenderingChannelI;
