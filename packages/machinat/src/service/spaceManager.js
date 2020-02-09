// @flow
import invariant from 'invariant';
import { resolveBindings } from './utils';
import ServiceMaker from './maker';
import type { ProvisionBinding, ServiceCache } from './types';
import InjectionScope from './scope';

/**
 * ServiceSpaceManager resolves service binding, initiates singleton services
 * and create InjectionScope for executing containers.
 */
export default class ServiceSpaceManager {
  maker: null | ServiceMaker;
  singletonCache: null | ServiceCache<any>;

  moduleBindings: ProvisionBinding[];
  registeredBindings: ProvisionBinding[];

  get isInitiated() {
    return !!(this.maker && this.singletonCache);
  }

  constructor() {
    this.maker = null;
    this.singletonCache = null;
    this.moduleBindings = [];
    this.registeredBindings = [];
  }

  addModuleBindings(bindings: ProvisionBinding[]) {
    invariant(!this.isInitiated);
    this.moduleBindings.push(...bindings);
  }

  addRegisteredBindings(bindings: ProvisionBinding[]) {
    invariant(!this.isInitiated);
    this.registeredBindings.push(...bindings);
  }

  async init() {
    invariant(!this.isInitiated);

    // resolve bindings from modules/registraions separately, the bindings
    // can not be conflicted within each
    const moduleResovled = resolveBindings(this.moduleBindings);
    const registrationsResolved = resolveBindings(this.registeredBindings);

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
    this.singletonCache = await this.maker.makeSingletonServices();
  }

  async createScope(platform: void | string): Promise<InjectionScope> {
    const { maker, singletonCache } = this;
    invariant(maker && singletonCache, 'injector is not initiated');

    const scopeCache = await maker.makeScopedServices(singletonCache, platform);

    const scopeInjector = new InjectionScope(
      platform,
      maker,
      singletonCache,
      scopeCache
    );

    return scopeInjector;
  }
}
