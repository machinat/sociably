import type ProvisionMap from './provisionMap.js';
import type {
  Interfaceable,
  ServiceProvider,
  ServiceRequirement,
  ServiceCache,
  ServiceBinding,
} from './types.js';

export const ENUM_PHASE_BOOTSTRAP = 1;
export const ENUM_PHASE_INIT_SCOPE = 2;
export const ENUM_PHASE_INJECTION = 3;

type PhaseEnum =
  | typeof ENUM_PHASE_BOOTSTRAP
  | typeof ENUM_PHASE_INIT_SCOPE
  | typeof ENUM_PHASE_INJECTION;

/**
 * MakeContext is the context passed down through the service dependencies
 * making tree. A MakeContext is created every time when a container is executed
 * or services being required with app.use(). The context itself should not be
 * modified within the making tree.
 */
type MakeContext = {
  phase: PhaseEnum;
  singletonCache: ServiceCache;
  scopedCache: ServiceCache;
  transientCache: ServiceCache;
  runtimeProvisions: null | Map<Interfaceable<unknown>, unknown>;
};

/** ServiceMaker makes services according to the services mapping resolved. */
export default class ServiceMaker {
  provisionMapping: ProvisionMap<ServiceBinding<unknown>>;

  constructor(provisionMapping: ProvisionMap<ServiceBinding<unknown>>) {
    this.provisionMapping = provisionMapping;
  }

  makeRequirements(
    requirements: ServiceRequirement<Interfaceable<unknown>>[],
    phase: PhaseEnum,
    singletonCache: ServiceCache,
    scopedCache: ServiceCache,
    runtimeProvisions: null | Map<Interfaceable<unknown>, unknown>,
  ): unknown[] {
    const services = this._makeRequirements(requirements, {
      phase,
      singletonCache,
      scopedCache,
      transientCache: new Map(),
      runtimeProvisions,
    });

    return services;
  }

  makeProvider(
    provider: ServiceProvider<unknown, unknown[]>,
    phase: PhaseEnum,
    singletonCache: ServiceCache,
    scopedCache: ServiceCache,
    runtimeProvisions: null | Map<Interfaceable<unknown>, unknown>,
  ): unknown {
    const instance = this._makeProvider(provider, {
      phase,
      singletonCache,
      scopedCache,
      transientCache: new Map(),
      runtimeProvisions,
    });

    return instance;
  }

  private _makeBinding(binding: ServiceBinding<unknown>, context: MakeContext) {
    if ('withValue' in binding) {
      return binding.withValue;
    }

    return this._makeProvider(binding.withProvider, context);
  }

  private _makeProvider(
    provider: ServiceProvider<unknown, unknown[]>,
    context: MakeContext,
  ) {
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
        } phase`,
      );
    }

    const { $$deps: deps, $$factory: factory } = provider;
    const args = this._makeRequirements(deps, context);
    const instance = factory(...args);

    cache.set(provider, instance);
    return instance;
  }

  private _makeRequirements(
    deps: ServiceRequirement<Interfaceable<unknown>>[],
    context: MakeContext,
  ) {
    const { runtimeProvisions } = context;
    const args: (unknown | unknown[] | Map<string, unknown>)[] = [];

    for (const { require: target, optional } of deps) {
      if (runtimeProvisions && runtimeProvisions.has(target)) {
        // service provided at runtime
        const runtimeProvided = runtimeProvisions.get(target);
        args.push(runtimeProvided);
      } else if (target.$$multi) {
        const resolvedList = this.provisionMapping.getMulti(target);
        args.push(
          resolvedList.map((binding) => this._makeBinding(binding, context)),
        );
      } else if (target.$$polymorphic) {
        const platformBindings = this.provisionMapping.getPolymorphic(target);
        const providingMapping = new Map();

        for (const [platform, binding] of platformBindings) {
          providingMapping.set(platform, this._makeBinding(binding, context));
        }

        args.push(providingMapping);
      } else {
        const resolved = this.provisionMapping.getSingular(target);
        if (!resolved && !optional) {
          throw new TypeError(`${target.$$name} is not bound`);
        }
        args.push(resolved ? this._makeBinding(resolved, context) : null);
      }
    }

    return args;
  }
}
