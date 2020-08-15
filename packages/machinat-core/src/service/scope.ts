import invariant from 'invariant';
import { polishInjectRequirement, isServiceContainer } from './utils';
import { MACHINAT_SERVICES_PROVIDER } from '../symbol';
import ServiceMaker, { ENUM_PHASE_INJECTION } from './maker';
import type {
  ServiceCache,
  ServiceContainer,
  Interfaceable,
  InjectRequirement,
} from './types';

/**
 * ServiceScope hpld the scope cache for later injection, any container
 * executed under the same scope share the same singleton and scoped services.
 */
export default class ServiceScope {
  static $$typeof: typeof MACHINAT_SERVICES_PROVIDER = MACHINAT_SERVICES_PROVIDER;
  static $$name = 'ServiceScope';
  static $$multi = false;

  platform: void | string;
  maker: ServiceMaker;
  singletonCache: ServiceCache;
  scopeCache: ServiceCache;

  constructor(
    platform: void | string,
    maker: ServiceMaker,
    singletonCache: ServiceCache,
    scopedCache?: ServiceCache
  ) {
    this.platform = platform;
    this.maker = maker;
    this.singletonCache = singletonCache;
    this.scopeCache = scopedCache || new Map();
  }

  useServices(
    targets: ReadonlyArray<Interfaceable | InjectRequirement>,
    runtimeProvisions?: Map<Interfaceable, any>
  ): any[] {
    const requirements = targets.map(polishInjectRequirement);

    const provisions = runtimeProvisions
      ? new Map(runtimeProvisions)
      : new Map();
    provisions.set(ServiceScope, this);

    const services = this.maker.makeRequirements(
      requirements,
      ENUM_PHASE_INJECTION,
      this.platform,
      this.singletonCache,
      this.scopeCache,
      provisions
    );

    return services;
  }

  injectContainer<T>(
    container: ServiceContainer<T>,
    runtimeProvisions?: Map<Interfaceable, any>
  ): T {
    invariant(isServiceContainer(container), 'invalid container');

    const provisions = runtimeProvisions
      ? new Map(runtimeProvisions)
      : new Map();
    provisions.set(ServiceScope, this);

    const args = this.useServices(container.$$deps, provisions);
    return container(...args);
  }

  duplicate(platform: void | string) {
    return new ServiceScope(
      platform,
      this.maker,
      this.singletonCache,
      new Map(this.scopeCache)
    );
  }
}
