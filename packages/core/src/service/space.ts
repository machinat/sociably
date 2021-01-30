/** @internal */ /** */
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
  PolymorphicProviderBinding,
  PolymorphicValueBinding,
} from './types';

const hasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const printInterface = (obj) => obj?.$$name || obj?.name || String(obj);

const isPolymorphic = <T>(
  target: ServiceBinding<T>
): target is PolymorphicProviderBinding<T> | PolymorphicValueBinding<T> =>
  !!target.provide.$$polymorphic;

const resolveBindings = (
  provisions: ServiceProvision<unknown>[]
): ProvisionMap<ServiceBinding<unknown>> => {
  const provisionMapping = new ProvisionMap<ServiceBinding<unknown>>();

  for (const provision of provisions) {
    let binding: ServiceBinding<unknown>;

    if (isServiceProvider(provision)) {
      binding = {
        provide: provision,
        withProvider: provision,
      };
    } else {
      if (!isInterfaceable(provision.provide)) {
        throw new TypeError(
          isInterfaceable(provision)
            ? `${printInterface(
                provision
              )} is an interface and cannot be provided directly`
            : `invalid service interface ${printInterface(provision.provide)}`
        );
      }

      if (
        !(
          hasOwnProperty(provision, 'withValue') ||
          ('withProvider' in provision &&
            isServiceProvider(provision.withProvider))
        )
      ) {
        throw new TypeError(
          'withProvider' in provision
            ? `invalid provider ${printInterface(provision.withProvider)}`
            : `either withProvider or withValue must be provided within binding`
        );
      }

      binding = provision;
    }

    if (isPolymorphic(binding)) {
      const { provide: target, platform } = binding;
      const replaced = provisionMapping.setPolymorphic(
        target,
        binding,
        platform
      );

      if (replaced) {
        throw new Error(
          `${target.$$name} is already bound to ${printInterface(
            'withProvider' in replaced
              ? replaced.withProvider
              : replaced.withValue
          )} on '${platform}' platform`
        );
      }
    } else if (binding.provide.$$multi) {
      provisionMapping.setMulti(binding.provide, binding);
    } else {
      const { provide: target } = binding;
      const replaced = provisionMapping.setSingular(target, binding);
      if (replaced) {
        throw new Error(
          `${target.$$name} is already bound to ${printInterface(
            'withProvider' in replaced
              ? replaced.withProvider
              : replaced.withValue
          )}`
        );
      }
    }
  }

  return provisionMapping;
};

export default class ServiceSpace {
  maker: ServiceMaker;
  provisionsMapping: ProvisionMap<ServiceBinding<unknown>>;
  _singletonCache: null | ServiceCache;

  constructor(
    base: null | ServiceSpace,
    provisions: ServiceProvision<unknown>[]
  ) {
    const baseMapping = base
      ? new ProvisionMap(base.provisionsMapping)
      : new ProvisionMap<ServiceBinding<unknown>>();
    const provisionMapping = resolveBindings(provisions);

    this._singletonCache = null;
    this.provisionsMapping = baseMapping.merge(provisionMapping);
    this.maker = new ServiceMaker(this.provisionsMapping);
  }

  bootstrap(
    bootstrapTimeProvisions: Map<Interfaceable<unknown>, unknown> = new Map()
  ): ServiceScope {
    const singletonCache = new Map();
    const scopedCache = new Map();

    const bootstrapScope = new ServiceScope(
      this.maker,
      singletonCache,
      scopedCache
    );

    const provisionMap = new Map(bootstrapTimeProvisions);
    provisionMap.set(ServiceScope, bootstrapScope);

    for (const [, binding] of this.provisionsMapping) {
      if ('withProvider' in binding) {
        const { withProvider: provider } = binding;
        this._verifyDependencies(provider, provisionMap, []);

        if (provider.$$lifetime === 'singleton') {
          this.maker.makeProvider(
            provider,
            ENUM_PHASE_BOOTSTRAP,
            singletonCache,
            scopedCache,
            provisionMap
          );
        }
      }
    }

    this._singletonCache = singletonCache;
    return bootstrapScope;
  }

  createScope(): ServiceScope {
    const singletonCache = this._singletonCache;
    if (!singletonCache) {
      throw new Error('service space has not bootstraped');
    }

    const scopeInjector = new ServiceScope(this.maker, singletonCache);
    return scopeInjector;
  }

  private _verifyDependencies(
    provider: ServiceProvider<unknown, unknown[]>,
    bootstrapProvisions: null | Map<Interfaceable<unknown>, unknown>,
    refLock: ServiceProvider<unknown, unknown[]>[]
  ) {
    const subRefLock = [...refLock, provider];

    for (const { require: target, optional } of provider.$$deps) {
      let bindings: null | ServiceBinding<unknown>[] = null;

      if (target.$$polymorphic) {
        const branches = this.provisionsMapping.getPolymorphic(target);

        bindings = [];
        for (const [, binding] of branches) {
          bindings.push(binding);
        }
      } else if (target.$$multi) {
        bindings = this.provisionsMapping.getMulti(target);
      } else if (target !== ServiceScope) {
        const binding = this.provisionsMapping.getSingular(target);

        const isProvidedOnBootstrap =
          provider.$$lifetime === 'singleton' &&
          !!bootstrapProvisions?.has(target);

        if (!binding && !optional && !isProvidedOnBootstrap) {
          throw new TypeError(`${target.$$name} is not bound`);
        }

        bindings = binding ? [binding] : null;
      }

      if (bindings) {
        for (const binding of bindings) {
          if ('withProvider' in binding) {
            const { withProvider: argProvider } = binding;

            if (subRefLock.indexOf(argProvider) !== -1) {
              throw new Error(`${argProvider.$$name} is circular dependent`);
            }

            this._verifyDependencies(
              argProvider,
              bootstrapProvisions,
              subRefLock
            );
          }
        }
      }
    }
  }
}
