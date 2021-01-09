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
  BranchedProviderBinding,
  BranchedValueBinding,
} from './types';

const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

const printProvider = (obj) => obj?.$$name || obj?.name || String(obj);

const isBranched = <T>(
  target: ServiceBinding<T>
): target is BranchedProviderBinding<T> | BranchedValueBinding<T> =>
  !!target.provide.$$branched;

const resolveBindings = (
  bindings: ServiceProvision<unknown>[]
): ProvisionMap<ServiceBinding<unknown>> => {
  const provisionMapping = new ProvisionMap<ServiceBinding<unknown>>();

  for (const bindingInput of bindings) {
    let binding: ServiceBinding<unknown>;

    if ('provide' in bindingInput) {
      if (!isInterfaceable(bindingInput.provide)) {
        throw new TypeError(
          `invalid interface ${printProvider(bindingInput.provide)}`
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
            ? `invalid provider ${printProvider(bindingInput.withProvider)}`
            : `either withProvider or withValue must be provided within binding`
        );
      }

      binding = bindingInput;
    } else {
      if (!isServiceProvider(bindingInput)) {
        throw new TypeError(`invalid provider ${printProvider(bindingInput)}`);
      }

      binding = {
        provide: bindingInput,
        withProvider: bindingInput,
      };
    }

    if (isBranched(binding)) {
      const { provide: target, platform } = binding;
      const replaced = provisionMapping.setBranched(target, binding, platform);

      if (replaced) {
        throw new Error(
          `${target.$$name} is already bound to ${printProvider(
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
          `${target.$$name} is already bound to ${printProvider(
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
    bindings: ServiceProvision<unknown>[]
  ) {
    const baseMapping = base
      ? new ProvisionMap(base.provisionsMapping)
      : new ProvisionMap<ServiceBinding<unknown>>();
    const bindingsMapping = resolveBindings(bindings);

    const provisionMapping = baseMapping.merge(bindingsMapping);

    this.maker = new ServiceMaker(provisionMapping);
    this.provisionsMapping = provisionMapping;
    this._singletonCache = null;
  }

  bootstrap(
    provisions: Map<Interfaceable<unknown>, unknown> = new Map()
  ): ServiceScope {
    const singletonCache = new Map();
    const scopedCache = new Map();

    const bootstrapScope = new ServiceScope(
      this.maker,
      singletonCache,
      scopedCache
    );

    const bootstrapProvisions = new Map(provisions);
    bootstrapProvisions.set(ServiceScope, bootstrapScope);

    for (const [, binding] of this.provisionsMapping) {
      if ('withProvider' in binding) {
        const { withProvider: provider } = binding;
        this._verifyDependencies(provider, bootstrapProvisions, []);

        if (provider.$$lifetime === 'singleton') {
          this.maker.makeProvider(
            provider,
            ENUM_PHASE_BOOTSTRAP,
            singletonCache,
            scopedCache,
            bootstrapProvisions
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

      if (target.$$branched) {
        const branches = this.provisionsMapping.getBranched(target);

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
