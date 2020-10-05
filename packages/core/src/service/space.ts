import ServiceMaker, { ENUM_PHASE_BOOTSTRAP } from './maker';
import ProvisionMap from './provisionMap';
import ServiceScope from './scope';
import { isServiceProvider, isInterfaceable } from './utils';
import type {
  ServiceBinding,
  ServiceProvision,
  ServiceCache,
  ServiceProvider,
  Interfaceable,
} from './types';

/** @internal */
const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

/** @internal */
const getNameOrToString = (obj: any) => obj?.name || String(obj);

/** @internal */
const resolveBindings = (
  bindings: ServiceProvision<any>[]
): ProvisionMap<ServiceBinding<any>> => {
  const provisionMapping = new ProvisionMap<ServiceBinding<any>>();

  for (const bindingInput of bindings) {
    let binding: ServiceBinding<any>;

    if ('provide' in bindingInput) {
      if (!isInterfaceable(bindingInput.provide)) {
        throw new TypeError(
          `invalid interface ${getNameOrToString(bindingInput.provide)}`
        );
      }

      if (
        !(
          objectHasOwnProperty(bindingInput, 'withValue') ||
          ('withProvider' in bindingInput &&
            isServiceProvider(bindingInput.withProvider))
        )
      ) {
        throw new TypeError(
          'withProvider' in bindingInput
            ? `invalid provider ${getNameOrToString(bindingInput.withProvider)}`
            : `either withProvider or withValue must be provided within binding`
        );
      }

      binding = bindingInput;
    } else {
      if (!isServiceProvider(bindingInput)) {
        throw new TypeError(
          `invalid provider ${getNameOrToString(bindingInput)}`
        );
      }

      binding = {
        provide: bindingInput,
        withProvider: bindingInput,
      };
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
        existedPlatforms.find((p) => platforms.includes(p));

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
  _provisionMapping: ProvisionMap<ServiceBinding<any>>;
  _singletonCache: null | ServiceCache<any>;

  constructor(
    moduleBindings: ServiceProvision<any>[],
    registeredBindings: ServiceProvision<any>[]
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

  bootstrap(
    provisions: Map<Interfaceable<any>, any> = new Map()
  ): ServiceScope {
    const singletonCache = new Map();
    const scopedCache = new Map();

    const bootstrapScope = new ServiceScope(
      undefined,
      this.maker,
      singletonCache,
      scopedCache
    );

    const bootstrapProvisions = new Map(provisions);
    bootstrapProvisions.set(ServiceScope, bootstrapScope);

    for (const [, platform, provided] of this._provisionMapping.iterAll()) {
      const bindings = Array.isArray(provided) ? provided : [provided];

      for (const binding of bindings) {
        if ('withProvider' in binding) {
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
    return bootstrapScope;
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

  private _verifyDependencies(
    provider: ServiceProvider<any>,
    platform: void | string,
    bootstrapProvisions: null | Map<Interfaceable<any>, any>,
    refLock: ServiceProvider<any>[]
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
          if ('withProvider' in binding) {
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
