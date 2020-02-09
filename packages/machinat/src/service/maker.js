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
 * Machinat DI
 *
 * container:
 *   The containter is the unit to consume the services with IoC style. It is
 *   just a plain function with services claimation annotated, the services
 *   instances will then being injected automatically within the app scope.
 *
 * token:
 *   There are three kinds of token type can be used as binding of service:
 *   1. string as token
 *   2. provider class as token
 *   3. abstract class as token
 *   the bindings must be configured before the app start. When a container
 *   claims with the token, the corresponded service bind to the token will be
 *   injected into the container.
 *
 * partially binding:
 *   A service can be bound only under specified platforms, and will be provided
 *   only under the scope of platforms bound.
 *
 * lifetime:
 *   1. "initiation" services will be created when app start and only be
 *      available by module factories while initiating. For most of time it is
 *      used to provide system utilities like HTTP server.
 *   2. "singeleton" services will be created after iniatiation, and will
 *      survive within the life of the app. All claimation of the same token
 *      would retrieve the same instance of singeleton service.
 *   3. "scoped" services will be created when it is claimed by a container
 *      within a scope, and will survive until the scope ends. For example while
 *      rendering, the same token will retrieve the same scoped service instance
 *      whereever the location of the tree is.
 *   4. "transient" services will be created every time it is claimed.
 *
 * phases:
 *   The following steps will be happen in order:
 *   1. app.start()
 *   2. initiation/singeleton services being created
 *   3. singeleton services being cached
 *   4. module.startHook being called
 *   5. startHook of initiation services being called
 *   6. app.start() resolve
 *   7. a scope being requested
 *   8. execute a container under the scope
 *   9. scoped/trasient services being created
 *   10. scoped services being cached
 *   11. inject and run the container
 *   12. repeat from 8. if more container to run
 */

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
  makingTracker: Map<ServiceProvider<any>, Promise<any>>,
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
  async makeSingletonServices(): Promise<ServiceCache<any>> {
    const context = {
      platform: undefined,
      phase: PHASE_ENUM_INITIATION,
      singletonCache: new Map(),
      scopeCache: new Map(),
      makingTracker: new Map(),
      runtimeProvisions: null,
    };

    const makingPromises = [];
    for (const [target, platform] of this.singletonIndex) {
      const binding = this._resolveProvisionAssertedly(target, platform, false);
      /* :: invariant(binding); */
      makingPromises.push(this._makeProvision(binding, context, []));
    }

    await Promise.all(makingPromises);
    return context.singletonCache;
  }

  /**
   * makeScopedServices creates the scoped services and return the cache
   */
  async makeScopedServices(
    singletonCache: ServiceCache<any>,
    platform: void | string
  ): Promise<ServiceCache<any>> {
    const context = {
      platform,
      phase: PHASE_ENUM_BEGIN_SCOPE,
      singletonCache,
      scopeCache: new Map(),
      makingTracker: new Map(),
      runtimeProvisions: null,
    };

    const makingPromises = [];
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
        makingPromises.push(this._makeProvision(binding, context, []));
      }
    }

    await Promise.all(makingPromises);
    return context.scopeCache;
  }

  /**
   * makeServices create a list of services according to the requirements
   */
  async makeServices(
    requirements: InjectRequirement[],
    platform: void | string,
    singletonCache: ServiceCache<any>,
    scopeCache: ServiceCache<any>,
    runtimeProvisions: null | Map<Interfaceable, any>
  ): Promise<any[]> {
    const services = await this._makeRequirements(
      requirements,
      {
        platform,
        phase: PHASE_ENUM_INJECTION,
        singletonCache,
        scopeCache,
        makingTracker: new Map(),
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

  async _makeProvision(
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
    const { singletonCache, scopeCache, makingTracker, phase } = context;

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

    // if the provider is now initiating, use the existing one
    const nowMaking = makingTracker.get(provider);
    if (nowMaking) {
      return nowMaking;
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

    const makingPromise = this._makeServiceInstance(provider, context, [
      ...refLock,
      provider,
    ]);

    // mark the provider is currently making
    makingTracker.set(provider, makingPromise);
    const instance = await makingPromise;

    // cache provided by strategy
    if (strategy === 'singleton') {
      singletonCache.set(provider, instance);
    } else if (strategy === 'scoped') {
      scopeCache.set(provider, instance);
    }

    return instance;
  }

  async _makeRequirements(
    deps: InjectRequirement[],
    context: MakeContext,
    refLock: ServiceProvider<any>[]
  ) {
    const { platform, runtimeProvisions } = context;
    const makings = [];

    for (const { require: target, optional } of deps) {
      let runtimeProvided;
      if (
        runtimeProvisions &&
        (runtimeProvided = runtimeProvisions.get(target))
      ) {
        // provided at runtime
        makings.push(runtimeProvided);
      } else {
        const binding = this._resolveProvisionAssertedly(
          target,
          platform,
          optional
        );

        if (binding) {
          makings.push(this._makeProvision(binding, context, refLock));
        } else {
          // dep is optional and not bound
          makings.push(null);
        }
      }
    }

    return Promise.all(makings);
  }

  async _makeServiceInstance<T>(
    provider: ServiceProvider<any>,
    context: MakeContext,
    refLock: ServiceProvider<any>[]
  ): Promise<T> {
    const { $$deps: deps, $$factory: factory } = provider;
    const args = await this._makeRequirements(deps, context, refLock);
    const result = await factory(...args);
    return result;
  }
}
