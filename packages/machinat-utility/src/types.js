// @flow
import type { MachinatRenderable } from 'machinat/types';

export type TraverseNodeCallback = (
  MachinatRenderable | Object,
  string,
  any
) => void;

export type NodeReducer = <Reduced>(
  Reduced,
  MachinatRenderable,
  string,
  any
) => Reduced;

export type NodeMapper = <Mapped>(MachinatRenderable, string, any) => Mapped;
