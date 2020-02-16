// @flow
import invariant from 'invariant';
import type ProvisionMap from './map';
import type {
  Interfaceable,
  ServiceProvider,
  InjectRequirement,
  ServiceCache,
  ProvisionBinding,
} from './types';

const PHASE_ENUM_BOOTSTRAP: 1 = 1;
const PHASE_ENUM_BEGIN_SCOPE: 2 = 2;
const PHASE_ENUM_INJECTION: 3 = 3;

type PhaseEnum =
  | typeof PHASE_ENUM_BOOTSTRAP
  | typeof PHASE_ENUM_BEGIN_SCOPE
  | typeof PHASE_ENUM_INJECTION;

/**
 * MakeContext is the context passed down through the service dependencies
 * making tree. A MakeContext is created every time when a container is
 * executed or services being required with app.use(). The context itself
 * should not be modified within the making tree.
 */
type MakeContext = {
  platform: void | string,
  phase: PhaseEnum,
  singletonCache: ServiceCache<any>,
  scopeCache: ServiceCache<any>,
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
    this._verifyDependencies();
  }

  /**
   * makeSingletonServices creates the singleton services and return the cache
   */
  makeSingletonServices(): ServiceCache<any> {
    const context = {
      platform: undefined,
      phase: PHASE_ENUM_BOOTSTRAP,
      singletonCache: new Map(),
      scopeCache: new Map(),
      runtimeProvisions: null,
    };

    for (const [target, platform] of this.singletonIndex) {
      const binding = this._resolveProvisionAssertedly(target, platform, false);
      /* :: invariant(binding); */
      this._makeProvision(binding, context);
    }

    return context.singletonCache;
  }

  /**
   * makeScopedServices creates the scoped services and return the cache
   */
  makeScopedServices(
    singletonCache: ServiceCache<any>,
    platform: void | string
  ): ServiceCache<any> {
    const context = {
      platform,
      phase: PHASE_ENUM_BEGIN_SCOPE,
      singletonCache,
      scopeCache: new Map(),
      runtimeProvisions: null,
    };

    // initiate provider with "scoped" strategy
    for (const [target, boundPlatform] of this.scopedIndex) {
      // skip other platform
      if (!boundPlatform || boundPlatform === platform) {
        const binding = this._resolveProvisionAssertedly(
          target,
          boundPlatform,
          false
        );
        /* :: invariant(binding); */
        this._makeProvision(binding, context);
      }
    }

    return context.scopeCache;
  }

  /**
   * makeRequirements create a list of services according to the requirements
   */
  makeRequirements(
    requirements: InjectRequirement[],
    platform: void | string,
    singletonCache: ServiceCache<any>,
    scopeCache: ServiceCache<any>,
    runtimeProvisions: null | Map<Interfaceable, any>
  ): any[] {
    const services = this._makeRequirements(requirements, {
      platform,
      phase: PHASE_ENUM_INJECTION,
      singletonCache,
      scopeCache,
      runtimeProvisions,
    });

    return services;
  }

  _resolveProvisionAssertedly(
    target: Interfaceable,
    platform: void | string,
    optional: boolean
  ) {
    let binding;
    if (platform) {
      binding =
        this.serviceMapping.getPlatform(target, platform) ||
        this.serviceMapping.getDefault(target);
    } else {
      binding = this.serviceMapping.getDefault(target);
    }

    invariant(binding || optional, `${target.name} is not bound`);
    return binding;
  }

  _makeProvision(binding: ProvisionBinding, context: MakeContext) {
    if (binding.withValue) {
      return binding.withValue;
    }

    const { withProvider: provider } = binding;
    const { $$strategy: strategy } = provider;
    const { singletonCache, scopeCache, phase } = context;

    // get cached instance by strategy
    let cached;
    if (strategy === 'singleton') {
      cached = singletonCache.get(provider);
    } else if (strategy === 'scoped') {
      cached = scopeCache.get(provider);
    }

    if (cached) {
      return cached;
    }

    // verify singleton/scoped provider creating phase
    invariant(
      strategy === 'transient' ||
        (strategy === 'scoped' && phase !== PHASE_ENUM_INJECTION) ||
        (strategy === 'singleton' && phase === PHASE_ENUM_BOOTSTRAP),
      `${strategy} service should not be created when ${
        phase === PHASE_ENUM_BOOTSTRAP
          ? 'bootstrap'
          : phase === PHASE_ENUM_BEGIN_SCOPE
          ? 'begin scope'
          : 'inject'
      } phase`
    );

    const instance = this._makeProviderInstance(provider, context);

    // cache provided by strategy
    if (strategy === 'singleton') {
      singletonCache.set(provider, instance);
    } else if (strategy === 'scoped') {
      scopeCache.set(provider, instance);
    }

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
        const binding = this._resolveProvisionAssertedly(
          target,
          platform,
          optional
        );

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

  _makeProviderInstance<T>(
    provider: ServiceProvider<any>,
    context: MakeContext
  ): T {
    const { $$deps: deps, $$factory: factory } = provider;
    const args = this._makeRequirements(deps, context);
    const result = factory(...args);
    return result;
  }

  _verifyDependencies() {
    for (const [, platform, binding] of this.serviceMapping) {
      if (binding.withProvider) {
        this._verifyProviderDependencies(binding.withProvider, platform, []);
      }
    }
  }

  _verifyProviderDependencies(
    provider: ServiceProvider<any>,
    platform: void | string,
    refLock: ServiceProvider<any>[]
  ) {
    const subRefLock = [...refLock, provider];

    for (const dep of provider.$$deps) {
      const binding = this._resolveProvisionAssertedly(
        dep.require,
        platform,
        dep.optional
      );

      if (binding && binding.withProvider) {
        const { withProvider: argProvider } = binding;

        invariant(
          subRefLock.indexOf(argProvider) === -1,
          `${argProvider.name} is circular dependent`
        );

        this._verifyProviderDependencies(argProvider, platform, subRefLock);
      }
    }
  }
}
