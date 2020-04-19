// @flow
import invariant from 'invariant';
import { polishInjectRequirement, isServiceContainer } from './utils';
import { MACHINAT_SERVICES_PROVIDER } from '../symbol';
import ServiceMaker from './maker';
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
  static $$typeof = MACHINAT_SERVICES_PROVIDER;
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
    scopeCache: ServiceCache
  ) {
    this.platform = platform;
    this.maker = maker;
    this.singletonCache = singletonCache;
    this.scopeCache = scopeCache;
  }

  useServices(
    targets: $ReadOnlyArray<Interfaceable | InjectRequirement>,
    runtimeProvisions?: Map<Interfaceable, any>
  ): any[] {
    const requirements = targets.map(polishInjectRequirement);

    const provisions = runtimeProvisions
      ? new Map(runtimeProvisions)
      : new Map();
    provisions.set(ServiceScope, this);

    const services = this.maker.makeRequirements(
      requirements,
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
}
