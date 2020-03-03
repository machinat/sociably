// @flow
import invariant from 'invariant';
import ProvisionMap from './provisionMap';
import type {
  Interfaceable,
  ServiceProvider,
  InjectRequirement,
  ServiceCache,
  ProvisionBinding,
} from './types';

const ENUM_PHASE_BOOTSTRAP: 1 = 1;
const ENUM_PHASE_INIT_SCOPE: 2 = 2;
const ENUM_PHASE_INJECTION: 3 = 3;

type PhaseEnum =
  | typeof ENUM_PHASE_BOOTSTRAP
  | typeof ENUM_PHASE_INIT_SCOPE
  | typeof ENUM_PHASE_INJECTION;

/**
 * MakeContext is the context passed down through the service dependencies
 * making tree. A MakeContext is created every time when a container is
 * executed or services being required with app.use(). The context itself
 * should not be modified within the making tree.
 */
type MakeContext = {
  platform: void | string,
  phase: PhaseEnum,
  singletonCache: ServiceCache,
  scopedCache: ServiceCache,
  transientCache: ServiceCache,
  runtimeProvisions: null | Map<Interfaceable, any>,
};

/**
 * ServiceMaker makes services according to the services mapping resolved
 */
export default class ServiceMaker {
  serviceMapping: ProvisionMap<ProvisionBinding>;
  singletonIndex: ProvisionMap<true>;
  scopedIndex: ProvisionMap<true>;

  constructor(
    serviceMapping: ProvisionMap<ProvisionBinding>,
    singletonIndex: ProvisionMap<true>,
    scopedIndex: ProvisionMap<true>
  ) {
    this.serviceMapping = serviceMapping;
    this.singletonIndex = singletonIndex;
    this.scopedIndex = scopedIndex;
  }

  /**
   * makeSingletonServices creates singleton services and return the cache
   */
  makeSingletonServices(
    bootstrapProvisions: null | Map<Interfaceable, any>
  ): [ServiceCache, ServiceCache] {
    const context = {
      platform: undefined,
      phase: ENUM_PHASE_BOOTSTRAP,
      singletonCache: new Map(),
      scopedCache: new Map(),
      transientCache: new Map(),
      runtimeProvisions: bootstrapProvisions,
    };

    for (const [target, platform] of this.singletonIndex.iterAll()) {
      const binding = this._resolveProvisionAssertedly(target, platform);
      this._makeProvision(binding, context);
    }

    for (const [target, platform] of this.scopedIndex.iterBranch(undefined)) {
      const binding = this._resolveProvisionAssertedly(target, platform);
      this._makeProvision(binding, context);
    }

    return [context.singletonCache, context.scopedCache];
  }

  /**
   * makeScopedServices creates the scoped services and return the cache
   */
  makeScopedServices(
    platform: void | string,
    singletonCache: ServiceCache,
    bootstrapProvisions: null | Map<Interfaceable, any>
  ): ServiceCache {
    const context = {
      platform,
      phase: ENUM_PHASE_INIT_SCOPE,
      singletonCache,
      scopedCache: new Map(),
      transientCache: new Map(),
      runtimeProvisions: bootstrapProvisions,
    };

    // initiate provider with "scoped" lifetime
    for (const [target, boundPlatform] of this.scopedIndex.iterBranch(
      platform
    )) {
      const binding = this._resolveProvisionAssertedly(target, boundPlatform);
      this._makeProvision(binding, context);
    }

    return context.scopedCache;
  }

  /**
   * makeRequirements create a list of services according to the requirements
   */
  makeRequirements(
    requirements: InjectRequirement[],
    platform: void | string,
    singletonCache: ServiceCache,
    scopedCache: ServiceCache,
    runtimeProvisions: null | Map<Interfaceable, any>
  ): any[] {
    const services = this._makeRequirements(requirements, {
      platform,
      phase: ENUM_PHASE_INJECTION,
      singletonCache,
      scopedCache,
      transientCache: new Map(),
      runtimeProvisions,
    });

    return services;
  }

  validateProvisions(bootstrapProvisions: null | Map<Interfaceable, any>) {
    for (const [, platform, binding] of this.serviceMapping.iterAll()) {
      if (binding.withProvider) {
        const provider = binding.withProvider;
        this._validateDependencies(provider, platform, bootstrapProvisions, []);
      }
    }
  }

  _resolveProvisionOptionally(target: Interfaceable, platform: void | string) {
    const binding = this.serviceMapping.get(target, platform);
    return binding;
  }

  _resolveProvisionAssertedly(target: Interfaceable, platform: void | string) {
    const binding = this.serviceMapping.get(target, platform);

    invariant(binding, `${target.$$name} is not bound`);
    return binding;
  }

  _makeProvision(binding: ProvisionBinding, context: MakeContext) {
    if (binding.withValue) {
      return binding.withValue;
    }

    const { withProvider: provider } = binding;
    const { $$lifetime: lifetime } = provider;
    const { singletonCache, scopedCache, transientCache, phase } = context;

    const cache =
      lifetime === 'singleton'
        ? singletonCache
        : lifetime === 'scoped'
        ? scopedCache
        : transientCache;

    const cached = cache.get(provider);
    if (cached) {
      return cached;
    }

    // verify provider creating phase
    invariant(
      lifetime === 'transient' ||
        (lifetime === 'scoped' && phase !== ENUM_PHASE_INJECTION) ||
        (lifetime === 'singleton' && phase === ENUM_PHASE_BOOTSTRAP),
      `${lifetime} service ${provider.$$name} should not be created in ${
        phase === ENUM_PHASE_BOOTSTRAP
          ? 'bootstrap'
          : phase === ENUM_PHASE_INIT_SCOPE
          ? 'begin scope'
          : 'inject'
      } phase`
    );

    const { $$deps: deps, $$factory: factory } = provider;
    const args = this._makeRequirements(deps, context);
    const instance = factory(...args);

    cache.set(provider, instance);
    return instance;
  }

  _makeRequirements(deps: InjectRequirement[], context: MakeContext) {
    const { platform, runtimeProvisions } = context;
    const args = [];

    for (const { require: target, optional } of deps) {
      let runtimeProvided;
      if (
        runtimeProvisions &&
        (runtimeProvided = runtimeProvisions.get(target))
      ) {
        // provided at runtime
        args.push(runtimeProvided);
      } else {
        const binding = optional
          ? this._resolveProvisionOptionally(target, platform)
          : this._resolveProvisionAssertedly(target, platform);

        if (binding) {
          args.push(this._makeProvision(binding, context));
        } else {
          // dep is optional and not bound
          args.push(null);
        }
      }
    }

    return args;
  }

  _validateDependencies(
    provider: ServiceProvider<any, any>,
    platform: void | string,
    bootstrapProvisions: null | Map<Interfaceable, any>,
    refLock: ServiceProvider<any, any>[]
  ) {
    const subRefLock = [...refLock, provider];

    for (const { require: target, optional } of provider.$$deps) {
      const isProvidedOnBootstrap =
        !!bootstrapProvisions && bootstrapProvisions.has(target);

      const binding =
        optional || isProvidedOnBootstrap
          ? this._resolveProvisionOptionally(target, platform)
          : this._resolveProvisionAssertedly(target, platform);

      if (binding && binding.withProvider) {
        const { withProvider: argProvider } = binding;

        invariant(
          subRefLock.indexOf(argProvider) === -1,
          `${argProvider.$$name} is circular dependent`
        );

        this._validateDependencies(
          argProvider,
          platform,
          bootstrapProvisions,
          subRefLock
        );
      }
    }
  }
}
