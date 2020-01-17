// @flow
import invariant from 'invariant';
import { resolveBindings } from './utils';
import ServiceMaker from './maker';
import { MACHINAT_SERVICES_CONTAINER } from './constant';
import type {
  ServiceModule,
  ProvisionBinding,
  ServiceCache,
  ServiceContainer,
  Interfaceable,
} from './types';

/**
 * ScopeInjector holds the cache of singleton, scoped and lazy service for later
 * injections
 */
export class ScopeInjector {
  platform: string;
  maker: ServiceMaker;
  singletonCache: ServiceCache<any>;
  scopeCache: ServiceCache<any>;

  constructor(
    platform: string,
    maker: ServiceMaker,
    singletonCache: ServiceCache<any>,
    scopeCache: ServiceCache<any>
  ) {
    this.platform = platform;
    this.maker = maker;
    this.singletonCache = singletonCache;
    this.scopeCache = scopeCache;
  }

  async runContainer(container: ServiceContainer<any>) {
    invariant(
      container.$$typeof === MACHINAT_SERVICES_CONTAINER,
      'invalid container'
    );
    return this.maker.injectContainer(
      container,
      this.platform,
      this.singletonCache,
      this.scopeCache
    );
  }
}

/**
 * AppInjector holds the singleton services for later injections
 */
export class AppInjector {
  maker: ServiceMaker;
  singletonCache: ServiceCache<any>;

  constructor(maker: ServiceMaker, singletonCache: ServiceCache<any>) {
    this.maker = maker;
    this.singletonCache = singletonCache;
  }

  async createScope(platform: string): Promise<ScopeInjector> {
    const scopeCache = await this.maker.makeScopedServices(
      this.singletonCache,
      platform
    );

    const scopeInjector = new ScopeInjector(
      platform,
      this.maker,
      this.singletonCache,
      scopeCache
    );

    return scopeInjector;
  }

  async makeServices(targets: Interfaceable[]) {
    const scopeCache = await this.maker.makeScopedServices(
      this.singletonCache,
      undefined
    );

    const instances = await this.maker.makeServices(
      targets,
      undefined,
      this.singletonCache,
      scopeCache
    );

    return instances;
  }
}

/**
 * createAppInjector create an AppInjector from modules and registrations
 */
export const createAppInjector = async (
  modules: ServiceModule[],
  registeredBindings: ProvisionBinding[]
) => {
  // resolve provisions from modules/registraions separately, the provisions
  // can not be conflicted within each
  const moduleResovled = resolveBindings(
    modules.reduce((provisions, m) => provisions.concat(m.provisions), [])
  );
  const registrationsResolved = resolveBindings(registeredBindings);

  // merge the mapping and indices, provision from registrations would replace
  // the one from modules if provided on both
  const serviceMapping = moduleResovled.serviceMapping.merge(
    registrationsResolved.serviceMapping
  );
  const singletonIndex = moduleResovled.singletonIndex.merge(
    registrationsResolved.singletonIndex
  );
  const scopedIndex = moduleResovled.scopedIndex.merge(
    registrationsResolved.scopedIndex
  );

  const maker = new ServiceMaker(serviceMapping, singletonIndex, scopedIndex);
  const singletonCache = await maker.makeSingletonServices();

  const appInjector = new AppInjector(maker, singletonCache);
  return appInjector;
};
