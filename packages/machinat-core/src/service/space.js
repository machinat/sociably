// @flow
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
): ProvisionMap<ProvisionBinding> => {
  const provisionMapping: ProvisionMap<ProvisionBinding> = new ProvisionMap();

  for (const bindingInput of bindings) {
    let binding;

    if (isServiceProvider(bindingInput)) {
      binding = ({
        provide: bindingInput,
        withProvider: bindingInput,
      }: ProvisionBinding);
    } else {
      if (!isInterfaceable(bindingInput.provide)) {
        throw new TypeError(
          bindingInput.provide
            ? `${bindingInput.provide} is not a valid interface to provide`
            : `invalid binding (${String(bindingInput)})`
        );
      }

      if (
        !objectHasOwnProperty(bindingInput, 'withValue') &&
        (!bindingInput.withProvider ||
          !isServiceProvider(bindingInput.withProvider))
      ) {
        throw new TypeError(
          bindingInput.withProvider
            ? `invalid provider ${bindingInput.withProvider}`
            : `either withProvider or withValue must be provided within binding`
        );
      }

      binding = bindingInput;
    }

    const { provide: target, platforms } = binding;
    const replacedBindings = provisionMapping.set(
      target,
      platforms || null,
      binding
    );

    if (replacedBindings) {
      const [{ platforms: existedPlatforms }] = replacedBindings;
      const conflictedPlatform =
        platforms &&
        existedPlatforms &&
        existedPlatforms.find(p => platforms.includes(p));

      throw new Error(
        `${target.$$name} is already bound on ${
          conflictedPlatform
            ? `"${conflictedPlatform}" platform`
            : 'default branch'
        }`
      );
    }
  }

  return provisionMapping;
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
    const moduleProvisionMapping = resolveBindings(moduleBindings);
    const registeredProvisionMapping = resolveBindings(registeredBindings);

    // merge the mapping and indices, bindings from registrations would replace
    // the one from modules if provided on both
    const provisionMapping = moduleProvisionMapping.merge(
      registeredProvisionMapping
    );

    this.maker = new ServiceMaker(provisionMapping);
    this.singletonCache = null;
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
