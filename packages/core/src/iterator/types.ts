import type { SociablyRenderable } from '../types.js';

export type TraverseNodeCallback<Context> = (
  node: SociablyRenderable,
  path: string,
  context: Context
) => void;

export type NodeReducer<Reduced, Payload> = (
  reduced: Reduced,
  node: SociablyRenderable,
  path: string,
  payload: Payload
) => Reduced;

export type NodeMapper<Mapped, Payload> = (
  node: SociablyRenderable,
  path: string,
  payload: Payload
) => Mapped;
