import type { SociablyNode, SociablyRenderable } from '../types.js';
import map from './map.js';

const identity = <T>(x: T) => x;

const toArray = (
  children: SociablyNode,
): SociablyRenderable[] | null | undefined =>
  map<SociablyRenderable, undefined>(children, identity, '$', undefined);

export default toArray;
