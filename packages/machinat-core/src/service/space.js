// @flow
import ServiceMaker, { ENUM_PHASE_BOOTSTRAP } from './maker';
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
  _provisionMapping: ProvisionMap<ProvisionBinding>;
  _singletonCache: null | ServiceCache;

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
    this._provisionMapping = provisionMapping;
    this._singletonCache = null;
  }

  bootstrap(bootstrapProvisions: Map<Interfaceable, any>) {
    const singletonCache = new Map();
    const scopedCache = new Map();

    for (const [, platform, provided] of this._provisionMapping.iterAll()) {
      const bindings = Array.isArray(provided) ? provided : [provided];

      for (const binding of bindings) {
        if (binding.withProvider) {
          const { withProvider: provider } = binding;
          this._verifyDependencies(provider, platform, bootstrapProvisions, []);

          if (provider.$$lifetime === 'singleton') {
            this.maker.makeProvider(
              provider,
              ENUM_PHASE_BOOTSTRAP,
              platform,
              singletonCache,
              scopedCache,
              bootstrapProvisions
            );
          }
        }
      }
    }

    this._singletonCache = singletonCache;
  }

  createScope(platform: void | string): ServiceScope {
    const singletonCache = this._singletonCache;
    if (!singletonCache) {
      throw new Error('service space has not bootstraped');
    }

    const scopeInjector = new ServiceScope(
      platform,
      this.maker,
      singletonCache
    );

    return scopeInjector;
  }

  _verifyDependencies(
    provider: ServiceProvider<any, any>,
    platform: void | string,
    bootstrapProvisions: null | Map<Interfaceable, any>,
    refLock: ServiceProvider<any, any>[]
  ) {
    const subRefLock = [...refLock, provider];

    for (const { require: target, optional } of provider.$$deps) {
      const isProvidedOnBootstrap =
        !!bootstrapProvisions && bootstrapProvisions.has(target);

      const provided = this._provisionMapping.get(target, platform);
      if (!provided && !optional && !isProvidedOnBootstrap) {
        throw new TypeError(`${target.$$name} is not bound`);
      }

      if (provided) {
        const bindings = Array.isArray(provided) ? provided : [provided];

        for (const binding of bindings) {
          if (binding.withProvider) {
            const { withProvider: argProvider } = binding;

            if (subRefLock.indexOf(argProvider) !== -1) {
              throw new Error(`${argProvider.$$name} is circular dependent`);
            }

            this._verifyDependencies(
              argProvider,
              platform,
              bootstrapProvisions,
              subRefLock
            );
          }
        }
      }
    }
  }
}
