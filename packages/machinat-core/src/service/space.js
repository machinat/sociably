// @flow
import invariant from 'invariant';
import ServiceMaker from './maker';
import type { ProvisionBinding, ServiceCache, ServiceProvider } from './types';
import ProvisionMap from './provisionMap';
import ServiceScope from './scope';
import { isServiceProvider } from './utils';

const resolveBindings = (
  bindings: (ServiceProvider<any> | ProvisionBinding)[]
): ProvisionMap<ProvisionBinding> => {
  const serviceMapping = new ProvisionMap();

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
      }
    } else {
      // annotate binding at the default branch
      const isUpdated = serviceMapping.setDefault(target, binding);
      invariant(
        !isUpdated,
        `${target.name} is already bound on default branch`
      );
    }
  }

  return serviceMapping;
};

/**
 * ServiceSpaceManager resolves service binding, initiates singleton services
 * and create ServiceScope for executing containers.
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
    const moduleMapping = resolveBindings(moduleBindings);
    const registerMapping = resolveBindings(registeredBindings);

    // merge the mapping and indices, bindings from registrations would replace
    // the one from modules if provided on both
    const serviceMapping = moduleMapping.merge(registerMapping);

    this.maker = new ServiceMaker(serviceMapping);
    this.singletonCache = this.maker.makeSingletonServices();
  }

  createScope(platform: void | string): ServiceScope {
    const scopeCache = this.maker.makeScopedServices(
      this.singletonCache,
      platform
    );

    const scopeInjector = new ServiceScope(
      platform,
      this.maker,
      this.singletonCache,
      scopeCache
    );

    return scopeInjector;
  }
}
