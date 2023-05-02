import { serviceInterface } from '../service';
import type { DispatchTarget } from '../types';

type RenderingTargetI = DispatchTarget;

const RenderingTargetI = serviceInterface<DispatchTarget>({
  name: 'RenderingTarget',
});

export default RenderingTargetI;
