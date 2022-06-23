import type { SociablyNode, SociablyRenderable } from '../types';
import map from './map';

const identity = <T>(x: T) => x;

const toArray = (
  children: SociablyNode
): SociablyRenderable[] | null | undefined =>
  map<SociablyRenderable, undefined>(children, identity, '$', undefined);

export default toArray;
