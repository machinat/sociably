// @flow
import type { MachinatNode } from '../types';
import type { NodeMapper } from './types';
import traverse from './traverse';

type MapTraverseContext<Mapped, Payload> = {
  mappedArray: Array<Mapped>,
  mapper: NodeMapper<Mapped, Payload>,
  payload: Payload,
};

const mapCallback = <Mapped, Payload>(
  child,
  path,
  context: MapTraverseContext<Mapped, Payload>
) => {
  const { mapper, payload, mappedArray } = context;
  const mapped = mapper(child, path, payload);
  mappedArray.push(mapped);
};

const map = <Mapped, Payload>(
  children: MachinatNode,
  mapper: NodeMapper<Mapped, Payload>,
  prefix: string,
  payload: any
): ?Array<Mapped> => {
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
