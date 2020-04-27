// @flow
import invariant from 'invariant';
import ServiceSpace, { isServiceContainer } from './service';
import type {
  Interfaceable,
  InjectRequirement,
  ServiceContainer,
  ServiceScope,
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
  | (Context => void)
  | ServiceContainer<(Context) => void>;

type ErrorListenable = (Error => void) | ServiceContainer<(Error) => void>;

const ENUM_UNSTARTED = 0;
const ENUM_STARTING = 1;
const ENUM_STARTED = 2;

export default class MachinatApp<
  Context: EventContext<any, any, any, any, any>
> {
  config: AppConfig<Context>;
  _status: number;
  _serviceSpace: ServiceSpace;
  _eventListeners: EventListenable<Context>[];
  _errorListeners: ErrorListenable[];

  get isStarted() {
    return this._status === ENUM_STARTED;
  }

  constructor(config: AppConfig<Context>) {
    this.config = config;
    this._status = ENUM_UNSTARTED;

    this._eventListeners = [];
    this._errorListeners = [];
  }

  async start() {
    invariant(
      this._status === ENUM_UNSTARTED,
      `app is ${
        this._status === ENUM_STARTING ? 'starting' : 'already started'
      }`
    );
    this._status = ENUM_STARTING;

    const { modules, platforms, bindings } = this.config;

    const moduleBindings = [];
    const startHooks = [];

    // bootstrap normal modules add bindings
    if (modules) {
      for (const { provisions, startHook } of modules) {
        moduleBindings.push(...provisions);

        if (startHook) {
          startHooks.push(startHook);
        }
      }
    }

    const mounterProvisions = new Map();

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
        moduleBindings.push(...provisions);

        mounterProvisions.set(
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

    this._serviceSpace = new ServiceSpace(moduleBindings, bindings || []);
    this._serviceSpace.bootstrap(mounterProvisions);

    const startingScope = this._serviceSpace.createScope(undefined);
    await Promise.all(
      startHooks.map(startHook => startingScope.injectContainer(startHook))
    );

    this._status = ENUM_STARTED;
  }

  useServices(
    targets: (Interfaceable | InjectRequirement)[],
    options?: { platform?: void | string }
  ) {
    invariant(this.isStarted, 'app is not started');

    const scope = this._serviceSpace.createScope(options?.platform);
    return scope.useServices(targets);
  }

  onEvent(listener: EventListenable<Context>) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    this._eventListeners.push(listener);
    return this;
  }

  removeEventListener(listener: EventListenable<Context>) {
    const idx = this._eventListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  _emitEvent(context: Context, scope: ServiceScope) {
    for (const listener of this._eventListeners) {
      if (isServiceContainer(listener)) {
        scope.injectContainer(listener)(context);
      } else {
        listener(context);
      }
    }
  }

  onError(listener: ErrorListenable) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    this._errorListeners.push(listener);
    return this;
  }

  removeErrorListener(listener: ErrorListenable) {
    const idx = this._errorListeners.findIndex(fn => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._errorListeners.splice(idx, 1);
    return true;
  }

  _emitError(err: Error, scope: ServiceScope) {
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

  _createPlatformMounter(
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

  _createPopEventWrapper(
    platform: string,
    middlewares: (
      | EventMiddleware<Context, any>
      | ServiceContainer<EventMiddleware<Context, any>>
    )[]
  ): PopEventWrapper<Context, any> {
    return makeResponse => {
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

  _createDispatchWrapper<Frame>(
    platform: string,
    middlewares: (
      | DispatchMiddleware<any, any, any>
      | ServiceContainer<DispatchMiddleware<any, any, any>>
    )[]
  ): DispatchWrapper<any, any, any> {
    return dispatch => {
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

        return ((middleware: any): DispatchMiddleware<any, any, any>)(
          frame,
          idx + 1 < middlewares.length ? execute(idx + 1, scope) : dispatch
        );
      };

      return (frame: Frame, scope?: ServiceScope) =>
        execute(0, scope || this._serviceSpace.createScope(platform))(frame);
    };
  }

  _createPopErrorFn(platform: string) {
    return (err: Error, scope?: ServiceScope) =>
      this._emitError(err, scope || this._serviceSpace.createScope(platform));
  }
}
