import type { MachinatRenderable } from '../types';

export type TraverseNodeCallback<Context> = (
  node: MachinatRenderable,
  path: string,
  context: Context
) => void;

export type NodeReducer<Reduced, Payload> = (
  reduced: Reduced,
  node: MachinatRenderable,
  path: string,
  payload: Payload
) => Reduced;

export type NodeMapper<Mapped, Payload> = (
  node: MachinatRenderable,
  path: string,
  payload: Payload
) => Mapped;
