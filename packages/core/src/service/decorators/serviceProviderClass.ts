import { SOCIABLY_SERVICE_PROVIDER } from '../../symbol';
import type {
  ServiceLifetime,
  ServiceProvider,
  ServiceDependency,
  Interfaceable,
  ResolveDependencies,
} from '../types';
import { polishServiceRequirement, validateLifetime } from '../utils';

type AnyDep = ServiceDependency<Interfaceable<unknown>>;

type ClassProviderOptions<T, Deps extends AnyDep[]> = {
  /** The provider name for debugging purpose */
  name?: string;
  /** The interfaces of the required dependencies */
  deps?: Deps;
  /** The factory function to create the instance, default to `(...deps) => new Klazz(...deps)` */
  factory?: (...args: ResolveDependencies<Deps>) => T;
  /** The lifetime of the instance, default to 'singleton' */
  lifetime?: ServiceLifetime;
};

type Constructor<T> = {
  new (...args: any[]): T;
};

function serviceProviderClass<_T, A extends AnyDep>(
  opts: ClassProviderOptions<_T, [A]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A]>> & Klazz;

function serviceProviderClass<_T, A extends AnyDep, B extends AnyDep>(
  opts: ClassProviderOptions<_T, [A, B]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B]>> & Klazz;

function serviceProviderClass<
  _T,
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep
>(
  opts: ClassProviderOptions<_T, [A, B, C]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B, C]>> & Klazz;

function serviceProviderClass<
  _T,
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep
>(
  opts: ClassProviderOptions<_T, [A, B, C, D]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B, C, D]>> & Klazz;

function serviceProviderClass<
  _T,
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep
>(
  opts: ClassProviderOptions<_T, [A, B, C, D, E]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B, C, D, E]>> & Klazz;

function serviceProviderClass<
  _T,
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep
>(
  opts: ClassProviderOptions<_T, [A, B, C, D, E, F]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B, C, D, E, F]>> & Klazz;

function serviceProviderClass<
  _T,
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep,
  G extends AnyDep
>(
  opts: ClassProviderOptions<_T, [A, B, C, D, E, F, G]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B, C, D, E, F, G]>> & Klazz;

function serviceProviderClass<
  _T,
  A extends AnyDep,
  B extends AnyDep,
  C extends AnyDep,
  D extends AnyDep,
  E extends AnyDep,
  F extends AnyDep,
  G extends AnyDep,
  H extends AnyDep
>(
  opts: ClassProviderOptions<_T, [A, B, C, D, E, F, G, H]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B, C, D, E, F, G, H]>> & Klazz;

function serviceProviderClass<
  _T,
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
  opts: ClassProviderOptions<_T, [A, B, C, D, E, F, G, H, I]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B, C, D, E, F, G, H, I]>> &
  Klazz;

function serviceProviderClass<
  _T,
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
  opts: ClassProviderOptions<_T, [A, B, C, D, E, F, G, H, I, J]>
): <T extends _T, Klazz extends Constructor<T>>(
  klazz: Klazz & Constructor<T>
) => ServiceProvider<T, ResolveDependencies<[A, B, C, D, E, F, G, H, I, J]>> &
  Klazz;

/**
 * serviceProviderClass annotate a class as a provider serving for the instance
 * type, and also an interface can be implemented.
 * @category Service Registry
 */
function serviceProviderClass<_T, Deps extends AnyDep[]>({
  name,
  factory,
  deps = [] as never,
  lifetime = 'singleton',
}: ClassProviderOptions<_T, Deps> = {}) {
  return <T extends _T, Klazz extends Constructor<T>>(
    klazz: Klazz & Constructor<T>
  ): ServiceProvider<T, ResolveDependencies<Deps>> & Klazz => {
    validateLifetime(lifetime);
    const requirements = deps.map(polishServiceRequirement);

    return Object.defineProperties(
      klazz as ServiceProvider<T, ResolveDependencies<Deps>> & Klazz,
      {
        $$name: { value: name || klazz.name, configurable: true },
        $$typeof: { value: SOCIABLY_SERVICE_PROVIDER, configurable: true },
        $$deps: { value: requirements, configurable: true },
        $$factory: {
          value: factory || ((...args) => new klazz(...args)), // eslint-disable-line new-cap
          configurable: true,
        },
        $$lifetime: { value: lifetime, configurable: true },
        $$multi: { value: false, configurable: true },
      }
    );
  };
}

export default serviceProviderClass;
