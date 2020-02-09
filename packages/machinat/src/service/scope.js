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
 * InjectionScope hpld the scope cache for later injection, any container
 * executed under the same scope share the same singleton and scoped services.
 */
export default class InjectionScope {
  platform: void | string;
  maker: ServiceMaker;
  singletonCache: ServiceCache<any>;
  scopeCache: ServiceCache<any>;

  constructor(
    platform: void | string,
    maker: ServiceMaker,
    singletonCache: ServiceCache<any>,
    scopeCache: ServiceCache<any>
  ) {
    this.platform = platform;
    this.maker = maker;
    this.singletonCache = singletonCache;
    this.scopeCache = scopeCache;
  }

  async useServices(
    targets: $ReadOnlyArray<Interfaceable | InjectRequirement>,
    runtimeProvisions?: Map<Interfaceable, any>
  ): Promise<any[]> {
    const requirements = targets.map(polishInjectRequirement);
    const services = await this.maker.makeServices(
      requirements,
      this.platform,
      this.singletonCache,
      this.scopeCache,
      runtimeProvisions || null
    );

    return services;
  }

  async executeContainer<T>(
    container: ServiceContainer<T>,
    runtimeProvisions?: Map<Interfaceable, any>
  ): Promise<T> {
    invariant(isServiceContainer(container), 'invalid container');

    const args = await this.useServices(container.$$deps, runtimeProvisions);
    return container(...args);
  }
}
