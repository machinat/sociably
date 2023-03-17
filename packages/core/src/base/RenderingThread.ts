import { makeInterface } from '../service';
import type { SociablyThread } from '../types';

type RenderingThreadI = null | SociablyThread;

const RenderingThreadI = makeInterface<RenderingThreadI>({
  name: 'RenderingThread',
});

export default RenderingThreadI;
