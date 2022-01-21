import invariant from 'invariant';
import { polishServiceRequirement, isServiceContainer } from './utils';
import { MACHINAT_SERVICE_INTERFACE } from '../symbol';
import type ServiceMaker from './maker';
import { ENUM_PHASE_INJECTION } from './maker';
import type {
  ServiceCache,
  ServiceContainer,
  Interfaceable,
  ServiceDependency,
  ResolveDependencies,
} from './types';

/**
 * ServiceScope hpld the scope cache for later injection, any container
 * executed under the same scope share the same singleton and scoped services.
 */
export default class ServiceScope {
  static $$typeof: typeof MACHINAT_SERVICE_INTERFACE =
    MACHINAT_SERVICE_INTERFACE;

  static $$name = 'ServiceScope';
  static $$multi = false as const;
  static $$polymorphic = false as const;

  maker: ServiceMaker;
  singletonCache: ServiceCache;
  scopeCache: ServiceCache;

  constructor(
    maker: ServiceMaker,
    singletonCache: ServiceCache,
    scopedCache?: ServiceCache
  ) {
    this.maker = maker;
    this.singletonCache = singletonCache;
    this.scopeCache = scopedCache || new Map();
  }

  useServices<Deps extends readonly ServiceDependency<any>[]>(
    dependencies: Deps,
    runtimeProvisions?: Map<Interfaceable<unknown>, unknown>
  ): ResolveDependencies<Deps> {
    const requirements = dependencies.map(polishServiceRequirement);

    const provisions = runtimeProvisions
      ? new Map(runtimeProvisions)
      : new Map();
    provisions.set(ServiceScope, this);

    const services = this.maker.makeRequirements(
      requirements,
      ENUM_PHASE_INJECTION,
      this.singletonCache,
      this.scopeCache,
      provisions
    );

    return services as any;
  }

  injectContainer<T>(
    container: ServiceContainer<T, unknown[]>,
    runtimeProvisions?: Map<Interfaceable<unknown>, unknown>
  ): T {
    invariant(isServiceContainer(container), 'invalid container');

    const provisions = runtimeProvisions
      ? new Map(runtimeProvisions)
      : new Map();
    provisions.set(ServiceScope, this);

    const args = this.useServices(container.$$deps, provisions);
    return container.$$factory(...args);
  }
}
