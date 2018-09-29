// @flow
import type { MachinatRenderable } from 'types/element';

export type TraverseElementCallback = (MachinatRenderable, string, any) => void;

export type ElementReducer = <Reduced>(
  Reduced,
  MachinatRenderable,
  string,
  any
) => Reduced;

export type ElementMapper = <Mapped>(MachinatRenderable, string, any) => Mapped;
