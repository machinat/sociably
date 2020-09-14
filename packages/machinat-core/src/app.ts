import invariant from 'invariant';
import ServiceSpace, { isServiceContainer } from './service';
import type {
  ServiceDependency,
  ServiceContainer,
  ServiceScope,
  AppProvision,
} from './service/types';
import type {
  AppConfig,
  EventContext,
  EventMiddleware,
  DispatchMiddleware,
  PopEventWrapper,
  DispatchWrapper,
  PlatformMounter,
} from './types';

type EventListenable<Context> =
  | ((ctx: Context) => void)
  | ServiceContainer<(ctx: Context) => void>;

type ErrorListenable =
  | ((err: Error) => void)
  | ServiceContainer<(err: Error) => void>;

/** @ignore */
const ENUM_UNSTARTED = 0;
/** @ignore */
const ENUM_STARTING = 1;
/** @ignore */
const ENUM_STARTED = 2;

export default class MachinatApp<Context extends EventContext<any, any, any>> {
  config: AppConfig<Context>;
  private _status: number;
  private _serviceSpace: ServiceSpace;
  private _eventListeners: EventListenable<Context>[];
  private _errorListeners: ErrorListenable[];

  get isStarted(): boolean {
    return this._status === ENUM_STARTED;
  }

  constructor(config: AppConfig<Context>) {
    this.config = config;
    this._status = ENUM_UNSTARTED;

    this._eventListeners = [];
    this._errorListeners = [];
  }

  async start(): Promise<void> {
    invariant(
      this._status === ENUM_UNSTARTED,
      `app is ${
        this._status === ENUM_STARTING ? 'starting' : 'already started'
      }`
    );
    this._status = ENUM_STARTING;

    const { modules, platforms, bindings } = this.config;

    const moduleProvisions: AppProvision<any>[] = [];
    const startHooks: ServiceContainer<Promise<void>>[] = [];

    // bootstrap normal modules add bindings
    if (modules) {
      for (const { provisions, startHook } of modules) {
        moduleProvisions.push(...provisions);

        if (startHook) {
          startHooks.push(startHook);
        }
      }
    }

    const platformMountingUtils = new Map();

    // add bindings and bridge bindings of platform module
    if (platforms) {
      for (const {
        name,
        provisions,
        mounterInterface,
        eventMiddlewares,
        dispatchMiddlewares,
        startHook,
      } of platforms) {
        moduleProvisions.push(...provisions);

        platformMountingUtils.set(
          mounterInterface,
          this._createPlatformMounter(
            name,
            eventMiddlewares || [],
            dispatchMiddlewares || []
          )
        );

        if (startHook) {
          startHooks.push(startHook);
        }
      }
    }

    this._serviceSpace = new ServiceSpace(moduleProvisions, bindings || []);
    const bootstrapScope = this._serviceSpace.bootstrap(platformMountingUtils);

    await Promise.all(
      startHooks.map((hook) => bootstrapScope.injectContainer(hook))
    );

    this._status = ENUM_STARTED;
  }

  useServices(
    targets: ServiceDependency<any>[],
    options?: { platform?: void | string }
  ): any[] {
    invariant(this.isStarted, 'app is not started');

    const scope = this._serviceSpace.createScope(options?.platform);
    return scope.useServices(targets);
  }

  onEvent(listener: EventListenable<Context>): MachinatApp<Context> {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    this._eventListeners.push(listener);
    return this;
  }

  removeEventListener(listener: EventListenable<Context>): boolean {
    const idx = this._eventListeners.findIndex((fn) => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  private _emitEvent(context: Context, scope: ServiceScope) {
    for (const listenerOrContainer of this._eventListeners) {
      const listener = isServiceContainer(listenerOrContainer)
        ? scope.injectContainer(listenerOrContainer)
        : listenerOrContainer;

      listener.call(this, context);
    }
  }

  onError(listener: ErrorListenable): MachinatApp<Context> {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    this._errorListeners.push(listener);
    return this;
  }

  removeErrorListener(listener: ErrorListenable): boolean {
    const idx = this._errorListeners.findIndex((fn) => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._errorListeners.splice(idx, 1);
    return true;
  }

  private _emitError(err: Error, scope: ServiceScope) {
    if (this._errorListeners.length === 0) {
      throw err;
    }

    for (const listener of this._errorListeners) {
      if (isServiceContainer(listener)) {
        scope.injectContainer(listener)(err);
      } else {
        listener(err);
      }
    }
  }

  private _createPlatformMounter(
    platform: string,
    eventMiddlewares: (
      | EventMiddleware<Context, any>
      | ServiceContainer<EventMiddleware<Context, any>>
    )[],
    dispatchMiddlewares: (
      | DispatchMiddleware<any, any, any>
      | ServiceContainer<DispatchMiddleware<any, any, any>>
    )[]
  ): PlatformMounter<Context, any, any, any, any> {
    return {
      initScope: () => this._serviceSpace.createScope(platform),
      popError: this._createPopErrorFn(platform),
      popEventWrapper: this._createPopEventWrapper(
        platform,
        eventMiddlewares || []
      ),
      dispatchWrapper: this._createDispatchWrapper(
        platform,
        dispatchMiddlewares || []
      ),
    };
  }

  private _createPopEventWrapper(
    platform: string,
    middlewares: (
      | EventMiddleware<Context, any>
      | ServiceContainer<EventMiddleware<Context, any>>
    )[]
  ): PopEventWrapper<Context, any> {
    return (makeResponse) => {
      const handlePopping = async (ctx: Context, scope?: ServiceScope) => {
        const response = await makeResponse(ctx);
        this._emitEvent(ctx, scope || this._serviceSpace.createScope(platform));
        return response;
      };

      if (middlewares.length === 0) {
        return handlePopping;
      }

      const finalHandler = (scope: ServiceScope) => (ctx: Context) =>
        handlePopping(ctx, scope);

      const execute = (idx: number, scope: ServiceScope) => async (
        ctx: Context
      ) => {
        let middleware = middlewares[idx];
        if (isServiceContainer(middleware)) {
          middleware = scope.injectContainer(middleware);
        }

        return middleware(
          ctx,
          idx + 1 < middlewares.length
            ? execute(idx + 1, scope)
            : finalHandler(scope)
        );
      };

      return async (ctx: Context, scopeInput?: ServiceScope) => {
        const scope = scopeInput || this._serviceSpace.createScope(platform);
        try {
          const response = await execute(0, scope)(ctx);
          return response;
        } catch (err) {
          this._emitError(err, scope);
          throw err;
        }
      };
    };
  }

  private _createDispatchWrapper<Frame>(
    platform: string,
    middlewares: (
      | DispatchMiddleware<any, any, any>
      | ServiceContainer<DispatchMiddleware<any, any, any>>
    )[]
  ): DispatchWrapper<any, any, any> {
    return (dispatch) => {
      if (middlewares.length === 0) {
        return dispatch;
      }

      const execute = (idx: number, scope: ServiceScope) => async (
        frame: Frame
      ) => {
        let middleware = middlewares[idx];
        if (isServiceContainer(middleware)) {
          middleware = scope.injectContainer(middleware);
        }

        return middleware(
          frame,
          idx + 1 < middlewares.length ? execute(idx + 1, scope) : dispatch
        );
      };

      return (frame: Frame, scope?: ServiceScope) =>
        execute(0, scope || this._serviceSpace.createScope(platform))(frame);
    };
  }

  private _createPopErrorFn(platform: string) {
    return (err: Error, scope?: ServiceScope) =>
      this._emitError(err, scope || this._serviceSpace.createScope(platform));
  }
}
