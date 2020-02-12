// @flow
import invariant from 'invariant';
import {
  PHASE_ENUM_INITIATION,
  PHASE_ENUM_BEGIN_SCOPE,
  PHASE_ENUM_INJECTION,
} from './constant';
import type { PhaseEnum } from './constant';
import type ProvisionMap from './map';
import type {
  Interfaceable,
  ServiceProvider,
  InjectRequirement,
  ServiceCache,
  ProvisionBinding,
} from './types';

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
  }

  /**
   * makeSingletonServices creates the singleton services and return the cache
   */
  makeSingletonServices(): ServiceCache<any> {
    const context = {
      platform: undefined,
      phase: PHASE_ENUM_INITIATION,
      singletonCache: new Map(),
      scopeCache: new Map(),
      runtimeProvisions: null,
    };

    for (const [target, platform] of this.singletonIndex) {
      const binding = this._resolveProvisionAssertedly(target, platform, false);
      /* :: invariant(binding); */
      this._makeProvision(binding, context, []);
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
        this._makeProvision(binding, context, []);
      }
    }

    return context.scopeCache;
  }

  /**
   * makeServices create a list of services according to the requirements
   */
  makeServices(
    requirements: InjectRequirement[],
    platform: void | string,
    singletonCache: ServiceCache<any>,
    scopeCache: ServiceCache<any>,
    runtimeProvisions: null | Map<Interfaceable, any>
  ): any[] {
    const services = this._makeRequirements(
      requirements,
      {
        platform,
        phase: PHASE_ENUM_INJECTION,
        singletonCache,
        scopeCache,
        runtimeProvisions,
      },
      []
    );

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

  _makeProvision(
    binding: ProvisionBinding,
    context: MakeContext,
    refLock: ServiceProvider<any>[]
  ) {
    if (binding.withValue) {
      // bound with value
      return binding.withValue;
    }

    const provider = binding.withService;
    // check for circular reference of dependencies
    invariant(refLock.indexOf(provider) === -1, 'circular dependent found');

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
        (strategy === 'singleton' && phase === PHASE_ENUM_INITIATION),
      `${strategy} service should not be created at ${
        phase === PHASE_ENUM_INITIATION
          ? 'initiation'
          : phase === PHASE_ENUM_BEGIN_SCOPE
          ? 'begin scope'
          : 'injection'
      } phase`
    );

    const instance = this._makeServiceInstance(provider, context, [
      ...refLock,
      provider,
    ]);

    // cache provided by strategy
    if (strategy === 'singleton') {
      singletonCache.set(provider, instance);
    } else if (strategy === 'scoped') {
      scopeCache.set(provider, instance);
    }

    return instance;
  }

  _makeRequirements(
    deps: InjectRequirement[],
    context: MakeContext,
    refLock: ServiceProvider<any>[]
  ) {
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
          args.push(this._makeProvision(binding, context, refLock));
        } else {
          // dep is optional and not bound
          args.push(null);
        }
      }
    }

    return args;
  }

  _makeServiceInstance<T>(
    provider: ServiceProvider<any>,
    context: MakeContext,
    refLock: ServiceProvider<any>[]
  ): T {
    const { $$deps: deps, $$factory: factory } = provider;
    const args = this._makeRequirements(deps, context, refLock);
    const result = factory(...args);
    return result;
  }
}
