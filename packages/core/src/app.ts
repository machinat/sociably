import invariant from 'invariant';
import ServiceSpace, { isServiceContainer } from './service';
import type {
  ServiceDependency,
  ServiceContainer,
  ServiceScope,
  ServiceProvision,
  ResolveDependencies,
  MaybeContainer,
} from './service/types';
import type { DispatchFrame } from './engine/types';
import { BaseBot, BaseProfiler, BaseMarshaler } from './base';
import type {
  AppConfig,
  EventContext,
  GetAppContext,
  EventMiddleware,
  DispatchMiddleware,
  PopEventWrapper,
  DispatchWrapper,
  PlatformMounter,
  PlatformModule,
} from './types';

type EventListenable<Context> = MaybeContainer<(ctx: Context) => void>;

type ErrorListenable = MaybeContainer<(err: Error) => void>;

/** @ignore */
const ENUM_UNSTARTED = 0;
/** @ignore */
const ENUM_STARTING = 1;
/** @ignore */
const ENUM_STARTED = 2;

export default class MachinatApp<
  Platform extends PlatformModule<any, unknown, unknown, any, unknown>,
  Context extends EventContext<any, any, any> = GetAppContext<Platform>
> {
  config: AppConfig<Platform>;
  private _status: number;
  private _serviceSpace: ServiceSpace;
  private _eventListeners: EventListenable<Context>[];
  private _errorListeners: ErrorListenable[];

  get isStarted(): boolean {
    return this._status === ENUM_STARTED;
  }

  constructor(config: AppConfig<Platform>) {
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

    const moduleProvisions: ServiceProvision<unknown>[] = [];
    const startHooks: ServiceContainer<Promise<void>, unknown[]>[] = [];

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
            eventMiddlewares || [],
            dispatchMiddlewares || []
          )
        );

        if (startHook) {
          startHooks.push(startHook);
        }
      }
    }

    const moduleOnlySpace = new ServiceSpace(null, [
      BaseBot,
      BaseProfiler,
      BaseMarshaler,
      ...moduleProvisions,
    ]);

    this._serviceSpace = new ServiceSpace(moduleOnlySpace, bindings || []);
    const bootstrapScope = this._serviceSpace.bootstrap(platformMountingUtils);

    await Promise.all(
      startHooks.map((hook) => bootstrapScope.injectContainer(hook))
    );

    this._status = ENUM_STARTED;
  }

  useServices<Deps extends readonly ServiceDependency<any>[]>(
    dependencies: Deps
  ): ResolveDependencies<Deps> {
    invariant(this.isStarted, 'app is not started');

    const scope = this._serviceSpace.createScope();
    return scope.useServices(dependencies);
  }

  onEvent(listener: EventListenable<Context>): MachinatApp<Platform, Context> {
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

  onError(listener: ErrorListenable): MachinatApp<Platform, Context> {
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
    eventMiddlewares: MaybeContainer<EventMiddleware<Context, any>>[],
    dispatchMiddlewares: MaybeContainer<DispatchMiddleware<any, any, any>>[]
  ): PlatformMounter<Context, any, any, any, any> {
    return {
      initScope: () => this._serviceSpace.createScope(),
      popError: this._createPopErrorFn(),
      popEventWrapper: this._createPopEventWrapper(eventMiddlewares || []),
      dispatchWrapper: this._createDispatchWrapper(dispatchMiddlewares || []),
    };
  }

  private _createPopEventWrapper(
    middlewares: MaybeContainer<EventMiddleware<Context, any>>[]
  ): PopEventWrapper<Context, any> {
    return (makeResponse) => {
      const handlePopping = async (ctx: Context, scope?: ServiceScope) => {
        const response = await makeResponse(ctx);
        this._emitEvent(ctx, scope || this._serviceSpace.createScope());
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
        const scope = scopeInput || this._serviceSpace.createScope();
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

  private _createDispatchWrapper(
    middlewares: MaybeContainer<DispatchMiddleware<unknown, any, unknown>>[]
  ): DispatchWrapper<unknown, any, unknown> {
    return (dispatch) => {
      if (middlewares.length === 0) {
        return dispatch;
      }

      const execute = (idx: number, scope: ServiceScope) => async (frame) => {
        let middleware = middlewares[idx];
        if (isServiceContainer(middleware)) {
          middleware = scope.injectContainer(middleware);
        }

        return middleware(
          frame,
          idx + 1 < middlewares.length ? execute(idx + 1, scope) : dispatch
        );
      };

      return (frame: DispatchFrame<any, unknown, any>, scope?: ServiceScope) =>
        execute(0, scope || this._serviceSpace.createScope())(frame);
    };
  }

  private _createPopErrorFn() {
    return (err: Error, scope?: ServiceScope) =>
      this._emitError(err, scope || this._serviceSpace.createScope());
  }
}
