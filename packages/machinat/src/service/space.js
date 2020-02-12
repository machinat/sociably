// @flow
import { resolveBindings } from './utils';
import ServiceMaker from './maker';
import type { ProvisionBinding, ServiceCache } from './types';
import InjectionScope from './scope';

/**
 * ServiceSpaceManager resolves service binding, initiates singleton services
 * and create InjectionScope for executing containers.
 */
export default class ServiceSpace {
  maker: ServiceMaker;
  singletonCache: ServiceCache<any>;

  moduleBindings: ProvisionBinding[];
  registeredBindings: ProvisionBinding[];

  constructor(
    moduleBindings: ProvisionBinding[],
    registeredBindings: ProvisionBinding[]
  ) {
    this.moduleBindings = moduleBindings;
    this.registeredBindings = registeredBindings;

    // resolve bindings from modules/registraions separately, the bindings
    // can not be conflicted within each
    const moduleResovled = resolveBindings(moduleBindings);
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

    this.maker = new ServiceMaker(serviceMapping, singletonIndex, scopedIndex);
    this.singletonCache = this.maker.makeSingletonServices();
  }

  createScope(platform: void | string): InjectionScope {
    const scopeCache = this.maker.makeScopedServices(
      this.singletonCache,
      platform
    );

    const scopeInjector = new InjectionScope(
      platform,
      this.maker,
      this.singletonCache,
      scopeCache
    );

    return scopeInjector;
  }
}
