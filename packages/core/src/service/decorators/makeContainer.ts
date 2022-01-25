import { MACHINAT_SERVICE_CONTAINER } from '../../symbol';
import type {
  ServiceContainer,
  ServiceDependency,
  Interfaceable,
  ResolveDependencies,
} from '../types';
import { polishServiceRequirement } from '../utils';

type AnyDep = ServiceDependency<Interfaceable<unknown>>;

type ContainerOptions<
  Deps extends ServiceDependency<Interfaceable<unknown>>[]
> = {
  /** The container name for debugging purpose */
  name?: string;
  /** The interfaces of the required dependencies */
  deps?: Deps;
};

type FactoryFn<T, Deps extends AnyDep[]> = (
  ...args: ResolveDependencies<Deps>
) => T;

type ContainerFn<T, Deps extends AnyDep[]> = ServiceContainer<
  T,
  ResolveDependencies<Deps>
> &
  ((...args: ResolveDependencies<Deps>) => T);

function makeContainer<A extends AnyDep>(
  opts: ContainerOptions<[A]>
): <T>(fn: FactoryFn<T, [A]>) => ContainerFn<T, [A]>;

function makeContainer<A extends AnyDep, B extends AnyDep>(
  opts: ContainerOptions<[A, B]>
): <T>(fn: FactoryFn<T, [A, B]>) => ContainerFn<T, [A, B]>;

function makeContainer<A extends AnyDep, B extends AnyDep, C extends AnyDep>(
  opts: ContainerOptions<[A, B, C]>
): <T>(fn: FactoryFn<T, [A, B, C]>) => ContainerFn<T, [A, B, C]>;

function makeContainer<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep
>(
  opts: ContainerOptions<[A, B, C, D]>
): <T>(fn: FactoryFn<T, [A, B, C, D]>) => ContainerFn<T, [A, B, C, D]>;

function makeContainer<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep
>(
  opts: ContainerOptions<[A, B, C, D, E]>
): <T>(fn: FactoryFn<T, [A, B, C, D, E]>) => ContainerFn<T, [A, B, C, D, E]>;

function makeContainer<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep
>(
  opts: ContainerOptions<[A, B, C, D, E, F]>
): <T>(
  fn: FactoryFn<T, [A, B, C, D, E, F]>
) => ContainerFn<T, [A, B, C, D, E, F]>;

function makeContainer<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep,
  G extends AnyDep
>(
  opts: ContainerOptions<[A, B, C, D, E, F, G]>
): <T>(
  fn: FactoryFn<T, [A, B, C, D, E, F, G]>
) => ContainerFn<T, [A, B, C, D, E, F, G]>;

function makeContainer<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep,
  G extends AnyDep,
  H extends AnyDep
>(
  opts: ContainerOptions<[A, B, C, D, E, F, G, H]>
): <T>(
  fn: FactoryFn<T, [A, B, C, D, E, F, G, H]>
) => ContainerFn<T, [A, B, C, D, E, F, G, H]>;

function makeContainer<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep,
  G extends AnyDep,
  H extends AnyDep,
  I extends AnyDep
>(
  opts: ContainerOptions<[A, B, C, D, E, F, G, H, I]>
): <T>(
  fn: FactoryFn<T, [A, B, C, D, E, F, G, H, I]>
) => ContainerFn<T, [A, B, C, D, E, F, G, H, I]>;

function makeContainer<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep,
  G extends AnyDep,
  H extends AnyDep,
  I extends AnyDep,
  J extends AnyDep
>(
  opts: ContainerOptions<[A, B, C, D, E, F, G, H, I, J]>
): <T>(
  fn: FactoryFn<T, [A, B, C, D, E, F, G, H, I, J]>
) => ContainerFn<T, [A, B, C, D, E, F, G, H, I, J]>;

/**
 * makeContainer marks a function as a container and annotate the dependencies.
 * @category Service Registry
 */
function makeContainer<Deps extends AnyDep[]>({
  name,
  deps = [] as never,
}: ContainerOptions<Deps>) {
  return <T>(fn: FactoryFn<T, Deps>): ContainerFn<T, Deps> => {
    const requirements = deps.map(polishServiceRequirement);

    return Object.defineProperties(fn as ContainerFn<T, Deps>, {
      $$typeof: { value: MACHINAT_SERVICE_CONTAINER, configurable: true },
      $$name: { value: name || fn.name, configurable: true },
      $$deps: { value: requirements, configurable: true },
      $$factory: { value: fn, configurable: true },
    });
  };
}

export default makeContainer;