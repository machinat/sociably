// @flow
import invariant from 'invariant';
import { polishInjectRequirement, isServiceContainer } from './utils';
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
    const services = this.maker.makeRequirements(
      requirements,
      this.platform,
      this.singletonCache,
      this.scopeCache,
      runtimeProvisions || null
    );

    return services;
  }

  injectContainer<T>(
    container: ServiceContainer<T>,
    runtimeProvisions?: Map<Interfaceable, any>
  ): T {
    invariant(isServiceContainer(container), 'invalid container');

    const args = this.useServices(container.$$deps, runtimeProvisions);
    return container(...args);
  }
}
