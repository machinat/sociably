import { makeInterface } from '../service';
import type { DispatchTarget } from '../types';

type RenderingTargetI = DispatchTarget;

const RenderingTargetI = makeInterface<DispatchTarget>({
  name: 'RenderingTarget',
});

export default RenderingTargetI;
