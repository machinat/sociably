// @flow
import type { MachinatRenderable } from 'machinat/types';

export type TraverseElementCallback = (
  MachinatRenderable | Object,
  string,
  any
) => void;

export type ElementReducer = <Reduced>(
  Reduced,
  MachinatRenderable,
  string,
  any
) => Reduced;

export type ElementMapper = <Mapped>(MachinatRenderable, string, any) => Mapped;
