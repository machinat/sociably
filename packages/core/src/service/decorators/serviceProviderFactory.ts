import { SOCIABLY_SERVICE_PROVIDER } from '../../symbol';
import type {
  ServiceLifetime,
  ServiceProvider,
  Interfaceable,
  ServiceDependency,
  ResolveDependencies,
} from '../types';
import { polishServiceRequirement, validateLifetime } from '../utils';

type AnyDep = ServiceDependency<Interfaceable<unknown>>;

type FactoryProviderOptions<Deps extends AnyDep[]> = {
  /** The provider name for debugging purpose */
  name?: string;
  /** The interfaces of the required dependencies */
  deps?: Deps;
  /** The lifetime of the instance, default to 'transient' */
  lifetime?: ServiceLifetime;
};

type FactoryFn<T, Deps extends AnyDep[]> = (
  ...args: ResolveDependencies<Deps>
) => T;

type ProviderFn<T, Deps extends AnyDep[]> = ServiceProvider<T, Deps> &
  ((...args: ResolveDependencies<Deps>) => T);

function serviceProviderFactory<A extends AnyDep>(
  opts: FactoryProviderOptions<[A]>
): <T>(factory: FactoryFn<T, [A]>) => ProviderFn<T, [A]>;

function serviceProviderFactory<A extends AnyDep, B extends AnyDep>(
  opts: FactoryProviderOptions<[A, B]>
): <T>(factory: FactoryFn<T, [A, B]>) => ProviderFn<T, [A, B]>;

function serviceProviderFactory<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep
>(
  opts: FactoryProviderOptions<[A, B, C]>
): <T>(factory: FactoryFn<T, [A, B, C]>) => ProviderFn<T, [A, B, C]>;

function serviceProviderFactory<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep
>(
  opts: FactoryProviderOptions<[A, B, C, D]>
): <T>(factory: FactoryFn<T, [A, B, C, D]>) => ProviderFn<T, [A, B, C, D]>;

function serviceProviderFactory<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep
>(
  opts: FactoryProviderOptions<[A, B, C, D, E]>
): <T>(
  factory: FactoryFn<T, [A, B, C, D, E]>
) => ProviderFn<T, [A, B, C, D, E]>;

function serviceProviderFactory<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep
>(
  opts: FactoryProviderOptions<[A, B, C, D, E, F]>
): <T>(
  factory: FactoryFn<T, [A, B, C, D, E, F]>
) => ServiceProvider<T, [A, B, C, D, E, F]>;

function serviceProviderFactory<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep,
  G extends AnyDep
>(
  opts: FactoryProviderOptions<[A, B, C, D, E, F, G]>
): <T>(
  factory: FactoryFn<T, [A, B, C, D, E, F, G]>
) => ProviderFn<T, [A, B, C, D, E, F, G]>;

function serviceProviderFactory<
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep,
  G extends AnyDep,
  H extends AnyDep
>(
  opts: FactoryProviderOptions<[A, B, C, D, E, F, G, H]>
): <T>(
  factory: FactoryFn<T, [A, B, C, D, E, F, G, H]>
) => ProviderFn<T, [A, B, C, D, E, F, G, H]>;

function serviceProviderFactory<
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
  opts: FactoryProviderOptions<[A, B, C, D, E, F, G, H, I]>
): <T>(
  factory: FactoryFn<T, [A, B, C, D, E, F, G, H, I]>
) => ProviderFn<T, [A, B, C, D, E, F, G, H, I]>;

function serviceProviderFactory<
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
  opts: FactoryProviderOptions<[A, B, C, D, E, F, G, H, I, J]>
): <T>(
  factory: FactoryFn<T, [A, B, C, D, E, F, G, H, I, J]>
) => ProviderFn<T, [A, B, C, D, E, F, G, H, I, J]>;

/**
 * serviceProviderFactory annotate a factory function as a provider serving for the
 * instance type, and also an interface can be implemented.
 * @category Service Registry
 */
function serviceProviderFactory<Deps extends AnyDep[]>({
  name,
  deps = [] as never,
  lifetime = 'transient',
}: FactoryProviderOptions<Deps> = {}) {
  return <T>(factory: FactoryFn<T, Deps>): ProviderFn<T, Deps> => {
    validateLifetime(lifetime);
    const requirements = deps.map(polishServiceRequirement);

    return Object.defineProperties(factory as ProviderFn<T, Deps>, {
      $$name: { value: name || factory.name, configurable: true },
      $$typeof: { value: SOCIABLY_SERVICE_PROVIDER, configurable: true },
      $$deps: { value: requirements, configurable: true },
      $$factory: { value: factory, configurable: true },
      $$lifetime: { value: lifetime, configurable: true },
      $$multi: { value: false, configurable: true },
    });
  };
}

export default serviceProviderFactory;
