/** @internal */ /** */
import ProvisionMap from './provisionMap';
import type {
  Interfaceable,
  ServiceProvider,
  ServiceRequirement,
  ServiceCache,
  ServiceBinding,
} from './types';

export const ENUM_PHASE_BOOTSTRAP = 1;
export const ENUM_PHASE_INIT_SCOPE = 2;
export const ENUM_PHASE_INJECTION = 3;

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
  platform: void | string;
  phase: PhaseEnum;
  singletonCache: ServiceCache<any>;
  scopedCache: ServiceCache<any>;
  transientCache: ServiceCache<any>;
  runtimeProvisions: null | Map<Interfaceable<any>, any>;
};

/**
 * ServiceMaker makes services according to the services mapping resolved.
 */
export default class ServiceMaker {
  provisionMapping: ProvisionMap<ServiceBinding<any>>;

  constructor(provisionMapping: ProvisionMap<ServiceBinding<any>>) {
    this.provisionMapping = provisionMapping;
  }

  makeRequirements(
    requirements: ServiceRequirement<any>[],
    phase: PhaseEnum,
    platform: void | string,
    singletonCache: ServiceCache<any>,
    scopedCache: ServiceCache<any>,
    runtimeProvisions: null | Map<Interfaceable<any>, any>
  ): any[] {
    const services = this._makeRequirements(requirements, {
      platform,
      phase,
      singletonCache,
      scopedCache,
      transientCache: new Map(),
      runtimeProvisions,
    });

    return services;
  }

  makeProvider(
    provider: ServiceProvider<any>,
    phase: PhaseEnum,
    platform: void | string,
    singletonCache: ServiceCache<any>,
    scopedCache: ServiceCache<any>,
    runtimeProvisions: null | Map<Interfaceable<any>, any>
  ): ServiceProvider<any> {
    const instance = this._makeProvider(provider, {
      platform,
      phase,
      singletonCache,
      scopedCache,
      transientCache: new Map(),
      runtimeProvisions,
    });

    return instance;
  }

  private _makeBinding(binding: ServiceBinding<any>, context: MakeContext) {
    if ('withValue' in binding) {
      return binding.withValue;
    }

    return this._makeProvider(binding.withProvider, context);
  }

  private _makeProvider(provider: ServiceProvider<any>, context: MakeContext) {
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
    if (lifetime === 'singleton' && phase !== ENUM_PHASE_BOOTSTRAP) {
      throw new TypeError(
        `${lifetime} service ${provider.$$name} should not be created in ${
          phase === ENUM_PHASE_INIT_SCOPE ? 'begin scope' : 'inject'
        } phase`
      );
    }

    const { $$deps: deps, $$factory: factory } = provider;
    const args = this._makeRequirements(deps, context);
    const instance = factory(...args);

    cache.set(provider, instance);
    return instance;
  }

  private _makeRequirements(
    deps: ServiceRequirement<any>[],
    context: MakeContext
  ) {
    const { platform, runtimeProvisions } = context;
    const args: (any | any[])[] = [];

    for (const { require: target, optional } of deps) {
      if (runtimeProvisions && runtimeProvisions.has(target)) {
        // service provided at runtime
        const runtimeProvided = runtimeProvisions.get(target);
        args.push(runtimeProvided);
      } else {
        const resolved = this.provisionMapping.get(target, platform);
        if (!resolved && !optional) {
          throw new TypeError(`${target.$$name} is not bound`);
        }

        if (!resolved) {
          // dep is optional and not bound
          args.push(null);
        } else if (Array.isArray(resolved)) {
          args.push(
            resolved.map((binding) => this._makeBinding(binding, context))
          );
        } else {
          args.push(this._makeBinding(resolved, context));
        }
      }
    }

    return args;
  }
}