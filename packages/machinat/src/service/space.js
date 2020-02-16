// @flow
import invariant from 'invariant';
import ServiceMaker from './maker';
import type { ProvisionBinding, ServiceCache, ServiceProvider } from './types';
import ProvisionMap from './map';
import InjectionScope from './scope';
import { isServiceProvider } from './utils';

const resolveBindings = (
  bindings: (ServiceProvider<any> | ProvisionBinding)[]
): {|
  serviceMapping: ProvisionMap<ProvisionBinding>,
  singletonIndex: ProvisionMap<true>,
  scopedIndex: ProvisionMap<true>,
|} => {
  const serviceMapping = new ProvisionMap();
  const singletonIndex = new ProvisionMap();
  const scopedIndex = new ProvisionMap();

  for (const bindingInput of bindings) {
    // $FlowFixMe
    const binding: ProvisionBinding = isServiceProvider(bindingInput)
      ? { provide: bindingInput, withProvider: bindingInput }
      : bindingInput;

    const { provide: target, platforms } = binding;

    if (platforms) {
      for (const platform of platforms) {
        // annotate binding at the platform branch
        const isUpdated = serviceMapping.setPlatform(
          target,
          platform,
          (binding: any)
        );
        invariant(
          !isUpdated,
          `${target.name} is already bound on platform "${platform}" branch`
        );

        // index singleton and scoped services
        if (
          binding.withValue ||
          binding.withProvider.$$strategy === 'singleton'
        ) {
          singletonIndex.setPlatform(target, platform, true);
        } else if (binding.withProvider.$$strategy === 'scoped') {
          scopedIndex.setPlatform(target, platform, true);
        }
      }
    } else {
      // annotate binding at the default branch
      const isUpdated = serviceMapping.setDefault(target, binding);
      invariant(
        !isUpdated,
        `${target.name} is already bound on default branch`
      );

      // index singleton and scoped services
      if (
        binding.withValue ||
        binding.withProvider.$$strategy === 'singleton'
      ) {
        singletonIndex.setDefault(target, true);
      } else if (binding.withProvider.$$strategy === 'scoped') {
        scopedIndex.setDefault(target, true);
      }
    }
  }

  return {
    serviceMapping,
    singletonIndex,
    scopedIndex,
  };
};

/**
 * ServiceSpaceManager resolves service binding, initiates singleton services
 * and create InjectionScope for executing containers.
 */
export default class ServiceSpace {
  maker: ServiceMaker;
  singletonCache: ServiceCache<any>;

  constructor(
    moduleBindings: (ServiceProvider<any> | ProvisionBinding)[],
    registeredBindings: (ServiceProvider<any> | ProvisionBinding)[]
  ) {
    // resolve bindings from modules/registraions separately, the bindings
    // cannot be conflicted within each
    const moduleResovled = resolveBindings(moduleBindings);
    const registrationsResolved = resolveBindings(registeredBindings);

    // merge the mapping and indices, bindings from registrations would replace
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
