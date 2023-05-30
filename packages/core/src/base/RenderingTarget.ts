import { serviceInterface } from '../service/index.js';
import type { DispatchTarget } from '../types.js';

type RenderingTargetI = DispatchTarget;

const RenderingTargetI = serviceInterface<DispatchTarget>({
  name: 'RenderingTarget',
});

export default RenderingTargetI;
