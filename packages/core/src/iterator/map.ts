import type { SociablyNode, SociablyRenderable } from '../types.js';
import type { NodeMapper } from './types.js';
import traverse from './traverse.js';

type MapTraverseContext<Mapped, Payload> = {
  mappedArray: Array<Mapped>;
  mapper: NodeMapper<Mapped, Payload>;
  payload: Payload;
};

const mapCallback = <Mapped, Payload>(
  child: SociablyRenderable,
  path: string,
  context: MapTraverseContext<Mapped, Payload>
) => {
  const { mapper, payload, mappedArray } = context;
  const mapped = mapper(child, path, payload);
  mappedArray.push(mapped);
};

const map = <Mapped, Payload>(
  children: SociablyNode,
  mapper: NodeMapper<Mapped, Payload>,
  prefix: string,
  payload: Payload
): Mapped[] | null | undefined => {
  if (children === undefined || children === null) {
    return children;
  }

  const context: MapTraverseContext<Mapped, Payload> = {
    mapper,
    payload,
    mappedArray: [],
  };

  traverse(children, prefix, context, mapCallback);
  return context.mappedArray;
};

export default map;
