import type { MachinatNode, MachinatRenderable } from '../types';
import map from './map';

const identity = <T>(x: T) => x;

const toArray = (
  children: MachinatNode
): MachinatRenderable[] | null | undefined =>
  map<MachinatRenderable, undefined>(children, identity, '$', undefined);

export default toArray;
