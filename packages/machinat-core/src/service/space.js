// @flow
import invariant from 'invariant';
import ServiceMaker from './maker';
import ProvisionMap from './provisionMap';
import ServiceScope from './scope';
import { isServiceProvider, isInterfaceable } from './utils';
import type {
  ProvisionBinding,
  ServiceCache,
  ServiceProvider,
  Interfaceable,
} from './types';

const Object$hasOwnProperty = Object.prototype.hasOwnProperty;
const objectHasOwnProperty = (obj, prop) =>
  Object$hasOwnProperty.call(obj, prop);

const resolveBindings = (
  bindings: (ServiceProvider<any, any> | ProvisionBinding)[]
): {
  provisionMapping: ProvisionMap<ProvisionBinding>,
  singletonIndex: ProvisionMap<true>,
  scopedIndex: ProvisionMap<true>,
} => {
  const provisionMapping: ProvisionMap<ProvisionBinding> = new ProvisionMap();
  const singletonIndex: ProvisionMap<true> = new ProvisionMap();
  const scopedIndex: ProvisionMap<true> = new ProvisionMap();

  for (const bindingInput of bindings) {
    let binding;

    if (isServiceProvider(bindingInput)) {
      binding = ({
        provide: bindingInput,
        withProvider: bindingInput,
      }: ProvisionBinding);
    } else {
      invariant(
        isInterfaceable(bindingInput.provide),
        bindingInput.provide
          ? `${bindingInput.provide} is not a valid interface to provide`
          : `invalid binding (${String(bindingInput)})`
      );
      invariant(
        objectHasOwnProperty(bindingInput, 'withValue') ||
          (bindingInput.withProvider &&
            isServiceProvider(bindingInput.withProvider)),
        bindingInput.withProvider
          ? `invalid provider ${bindingInput.withProvider}`
          : `either withProvider or withValue must be provided within binding`
      );

      binding = bindingInput;
    }

    const { provide: target, platforms } = binding;

    if (platforms) {
      for (const platform of platforms) {
        // annotate binding at the platform branch
        const isUpdated = provisionMapping.set(target, platform, binding);
        invariant(
          !isUpdated,
          `${target.$$name} is already bound on platform "${platform}" branch`
        );

        if (binding.withProvider) {
          const provider = binding.withProvider;

          if (provider.$$lifetime === 'singleton') {
            singletonIndex.set(target, platform, true);
          } else if (provider.$$lifetime === 'scoped') {
            scopedIndex.set(target, platform, true);
          }
        }
      }
    } else {
      // annotate binding at the default branch
      const isUpdated = provisionMapping.set(target, undefined, binding);
      invariant(
        !isUpdated,
        `${target.$$name} is already bound on default branch`
      );

      if (binding.withProvider) {
        const provider = binding.withProvider;

        if (provider.$$lifetime === 'singleton') {
          singletonIndex.set(target, undefined, true);
        } else if (provider.$$lifetime === 'scoped') {
          scopedIndex.set(target, undefined, true);
        }
      }
    }
  }

  return { provisionMapping, singletonIndex, scopedIndex };
};

export default class ServiceSpace {
  maker: ServiceMaker;
  singletonCache: null | ServiceCache;

  constructor(
    moduleBindings: (ServiceProvider<any, any> | ProvisionBinding)[],
    registeredBindings: (ServiceProvider<any, any> | ProvisionBinding)[]
  ) {
    // resolve bindings from modules/registraions separately, the bindings
    // cannot be conflicted within each
    const moduleResolved = resolveBindings(moduleBindings);
    const registerResolved = resolveBindings(registeredBindings);

    // merge the mapping and indices, bindings from registrations would replace
    // the one from modules if provided on both
    const provisionMapping = moduleResolved.provisionMapping.merge(
      registerResolved.provisionMapping
    );
    const singletonIndex = moduleResolved.singletonIndex.merge(
      registerResolved.singletonIndex
    );
    const scopedIndex = moduleResolved.scopedIndex.merge(
      registerResolved.scopedIndex
    );

    this.singletonCache = null;
    this.maker = new ServiceMaker(
      provisionMapping,
      singletonIndex,
      scopedIndex
    );
  }

  bootstrap(bootstrapTimeProvisions: Map<Interfaceable, any>) {
    this.maker.validateProvisions(bootstrapTimeProvisions);
    const [singletonCache, scopedCache] = this.maker.makeSingletonServices(
      bootstrapTimeProvisions
    );

    this.singletonCache = singletonCache;

    return new ServiceScope(undefined, this.maker, singletonCache, scopedCache);
  }

  createScope(platform: void | string): ServiceScope {
    const { singletonCache } = this;
    if (!singletonCache) {
      throw new Error('space not bootstraped');
    }

    const scopedCache = this.maker.makeScopedServices(
      platform,
      singletonCache,
      null
    );

    const scopeInjector = new ServiceScope(
      platform,
      this.maker,
      singletonCache,
      scopedCache
    );

    return scopeInjector;
  }
}
